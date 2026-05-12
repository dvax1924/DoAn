const Order = require('../models/Order');
const { io } = require('../socket');
const {
  validateAndBuildOrderItems,
  reserveInventory,
  releaseOrderInventory
} = require('../services/orderService');
const {
  createVnpayTxnRef,
  buildVnpayPaymentUrl,
  getVnpayConfig
} = require('../utils/vnpay');

function emitNewOrderCreated(order) {
  try {
    const payload = typeof order?.toObject === 'function' ? order.toObject() : order;
    io.to('admins').emit('newOrderCreated', { order: payload });
  } catch (emitError) {
    console.error('Emit newOrderCreated failed:', emitError);
  }
}

function getClientIp(req) {
  return req.headers['x-forwarded-for']
    || req.connection?.remoteAddress
    || req.socket?.remoteAddress
    || '127.0.0.1';
}

async function assignVnpayPaymentUrl(order, clientIp) {
  order.paymentRef = createVnpayTxnRef();

  const { paymentUrl, expireDate } = buildVnpayPaymentUrl({
    amount: order.totalAmount,
    ipAddr: clientIp,
    txnRef: order.paymentRef,
    orderInfo: `Thanh toan don hang ${order._id}`
  });

  order.paymentUrlExpiresAt = new Date(
    `${expireDate.slice(0, 4)}-${expireDate.slice(4, 6)}-${expireDate.slice(6, 8)}T${expireDate.slice(8, 10)}:${expireDate.slice(10, 12)}:${expireDate.slice(12, 14)}+07:00`
  );

  return paymentUrl;
}

exports.createOrder = async (req, res) => {
  let order;

  try {
    const { items, shippingAddress, paymentMethod = 'COD' } = req.body;
    const normalizedPaymentMethod = String(paymentMethod || 'COD').toUpperCase();

    if (!['COD', 'VNPAY'].includes(normalizedPaymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Phuong thuc thanh toan khong hop le'
      });
    }

    if (normalizedPaymentMethod === 'VNPAY') {
      try {
        getVnpayConfig();
      } catch {
        return res.status(400).json({
          success: false,
          message: 'VNPay chua duoc cau hinh tren backend'
        });
      }
    }

    const { orderItems, totalAmount } = await validateAndBuildOrderItems(items);
    const reserveResult = await reserveInventory(orderItems);

    if (!reserveResult.success) {
      return res.status(400).json({
        success: false,
        message: reserveResult.message
      });
    }

    order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      totalAmount,
      paymentMethod: normalizedPaymentMethod,
      paymentStatus: 'pending',
      paymentRef: normalizedPaymentMethod === 'VNPAY' ? createVnpayTxnRef() : undefined,
      inventoryAdjusted: true,
      orderStatus: 'pending'
    });

    if (normalizedPaymentMethod === 'COD') {
      emitNewOrderCreated(order);

      return res.status(201).json({
        success: true,
        message: 'Tao don hang COD thanh cong',
        order
      });
    }

    const paymentUrl = await assignVnpayPaymentUrl(order, getClientIp(req));
    await order.save();

    emitNewOrderCreated(order);

    return res.status(201).json({
      success: true,
      message: 'Tao don hang VNPAY thanh cong',
      order,
      paymentUrl
    });
  } catch (error) {
    console.error('Create order failed:', error);

    if (order?.inventoryAdjusted) {
      await releaseOrderInventory(order);
    }

    if (order?._id) {
      await Order.deleteOne({ _id: order._id }).catch(() => null);
    }

    if (error.message === 'VNPAY config is missing') {
      return res.status(400).json({
        success: false,
        message: 'VNPay chua duoc cau hinh tren backend'
      });
    }

    return res.status(500).json({ success: false, message: error.message });
  }
};

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

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product', 'name images')
      .populate('user', 'name email phone');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Khong tim thay don hang' });
    }

    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Khong co quyen xem don hang nay' });
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

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

exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus, shippingAddress } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Khong tim thay don hang' });
    }

    const isOwner = order.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Ban khong co quyen thuc hien thao tac nay'
      });
    }

    if (!isAdmin && order.orderStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Khong the chinh sua don hang nay nua'
      });
    }

    if (!isAdmin && orderStatus === 'cancelled' && order.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Don hang da thanh toan khong the huy tu phia khach hang'
      });
    }

    if (orderStatus === 'cancelled' && order.paymentMethod === 'VNPAY' && order.paymentStatus === 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Don hang dang cho ket qua thanh toan VNPay, khong the huy luc nay'
      });
    }

    if (orderStatus) {
      order.orderStatus = orderStatus;

      if (orderStatus === 'cancelled' && order.paymentStatus !== 'paid') {
        await releaseOrderInventory(order);
        order.paymentStatus = 'cancelled';
      }
    }

    if (shippingAddress) {
      order.shippingAddress = {
        ...order.shippingAddress,
        ...shippingAddress
      };
    }

    await order.save();

    if (orderStatus) {
      const userId = order.user.toString();
      io.to(userId).emit('orderStatusUpdated', {
        orderId: order._id,
        newStatus: orderStatus
      });
    }

    res.json({
      success: true,
      message: 'Cap nhat don hang thanh cong',
      order
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOrdersToday = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const orders = await Order.find({
      createdAt: { $gte: today, $lt: tomorrow }
    })
      .sort({ createdAt: -1 })
      .populate('user', 'name email phone')
      .populate('items.product', 'name images');

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, currentOrder) => sum + currentOrder.totalAmount, 0);

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
