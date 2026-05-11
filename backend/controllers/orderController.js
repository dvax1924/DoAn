const Order = require('../models/Order');
const Product = require('../models/Product');
const { io } = require('../socket');

// ====================== CREATE ORDER (Customer) ======================
exports.createOrder = async (req, res) => {
  try {
    const { items, shippingAddress } = req.body;

    let totalAmount = 0;
    const orderItems = [];

    for (let item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ success: false, message: `Không tìm thấy sản phẩm` });
      }

      const variant = product.variants.find(v => v.size === item.variant?.size);

      if (!variant) {
        return res.status(400).json({ 
          success: false, 
          message: `Lựa chọn không tồn tại` 
        });
      }

      if (variant.stock < item.qty) {
        return res.status(400).json({ 
          success: false, 
          message: `Sản phẩm không đủ hàng` 
        });
      }

      const itemPrice = Number(product.price);

      if (isNaN(itemPrice) || itemPrice < 0) {
        return res.status(400).json({
          success: false,
          message: 'Giá sản phẩm không hợp lệ'
        });
      }

      orderItems.push({
        product: item.product,
        variant: item.variant,
        qty: item.qty,
        price: itemPrice
      });

      totalAmount += itemPrice * item.qty;
    }

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      totalAmount,
      paymentMethod: 'COD',           // Chỉ COD
      orderStatus: 'pending'
    });

    // Giảm tồn kho
    for (let item of items) {
      await Product.updateOne({
        _id: item.product,
        'variants.size': item.variant?.size
      }, {
        $inc: { 'variants.$.stock': -item.qty }
      });
    }

    // 🔔 Thông báo real-time cho admin khi có đơn hàng mới
    io.emit('newOrderCreated', { order });

    res.status(201).json({ 
      success: true, 
      message: 'Tạo đơn hàng COD thành công',
      order 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ====================== GET MY ORDERS ======================
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('items.product', 'name images');

    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ====================== GET ORDER BY ID ======================
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product', 'name images')
      .populate('user', 'name email phone');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    // Chỉ cho phép xem đơn của chính mình hoặc admin
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Không có quyền xem đơn hàng này' });
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ====================== ADMIN: GET ALL ORDERS ======================
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate('user', 'name email')
      .populate('items.product', 'name');

    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ====================== UPDATE ORDER STATUS & SHIPPING ADDRESS ======================
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus, shippingAddress } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    // Kiểm tra quyền
    const isOwner = order.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền thực hiện thao tác này' });
    }

    // Khách hàng chỉ được cập nhật khi đơn đang pending
    if (!isAdmin && order.orderStatus !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: 'Không thể chỉnh sửa đơn hàng này nữa' 
      });
    }

    // Cập nhật trạng thái (nếu có)
    if (orderStatus) {
      order.orderStatus = orderStatus;
    }

    // Cập nhật địa chỉ giao hàng (nếu có)
    if (shippingAddress) {
      order.shippingAddress = {
        ...order.shippingAddress,
        ...shippingAddress
      };
    }

    await order.save();

    // 🔔 Gửi thông báo real-time đến customer qua Socket.IO
    if (orderStatus) {
      const userId = order.user.toString();
      io.to(userId).emit('orderStatusUpdated', {
        orderId: order._id,
        newStatus: orderStatus
      });
    }

    res.json({ 
      success: true, 
      message: 'Cập nhật đơn hàng thành công', 
      order 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// ====================== ADMIN: GET ORDERS TODAY ======================
exports.getOrdersToday = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Bắt đầu từ 00:00:00

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const orders = await Order.find({
      createdAt: { $gte: today, $lt: tomorrow }
    })
    .sort({ createdAt: -1 })
    .populate('user', 'name email phone')
    .populate('items.product', 'name images');

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);

    res.json({
      success: true,
      date: today.toISOString().split('T')[0],
      totalOrders,
      totalRevenue,
      orders
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
