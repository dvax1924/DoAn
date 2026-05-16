const Order = require('../models/Order');
const { io } = require('../socket');
const { releaseOrderInventory } = require('../services/orderService');
const {
  verifyVnpayCallback,
  buildFrontendReturnUrl,
  buildVnpayPaymentUrl,
  createVnpayTxnRef,
  normalizeIp
} = require('../utils/vnpay');

function emitOrderPaymentUpdated(order) {
  const payload = {
    orderId: order._id,
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus
  };

  try {
    io.to('admins').emit('orderPaymentUpdated', payload);
    io.emit('orderPaymentUpdated', payload);
    io.to(order.user.toString()).emit('orderPaymentUpdated', payload);
  } catch (emitError) {
    console.error('Emit orderPaymentUpdated failed:', emitError);
  }
}

async function finalizeVnpayOrder(order, params) {
  const amountFromGateway = Number(params.vnp_Amount || 0) / 100;
  const isSuccess = params.vnp_ResponseCode === '00'
    && (!params.vnp_TransactionStatus || params.vnp_TransactionStatus === '00');

  if (Math.round(amountFromGateway) !== Math.round(Number(order.totalAmount || 0))) {
    return {
      ok: false,
      code: '04'
    };
  }

  if (order.paymentStatus === 'paid') {
    return {
      ok: true,
      alreadyProcessed: true,
      status: 'success'
    };
  }

  order.paymentTransactionNo = params.vnp_TransactionNo || order.paymentTransactionNo;
  order.paymentBankCode = params.vnp_BankCode || order.paymentBankCode;
  order.paymentBankTranNo = params.vnp_BankTranNo || order.paymentBankTranNo;
  order.paymentResponseCode = params.vnp_ResponseCode || order.paymentResponseCode;

  if (isSuccess) {
    order.paymentStatus = 'paid';
    order.paidAt = new Date();
    await order.save();

    emitOrderPaymentUpdated(order);

    return {
      ok: true,
      status: 'success'
    };
  }

  // Khi thanh toán thất bại: chỉ đánh dấu paymentStatus='failed'
  // KHÔNG hủy đơn hàng và KHÔNG release inventory ngay
  // → Cho phép user retry thanh toán từ trang VnpayReturn
  // Inventory chỉ được release khi user thực sự hủy (PUT /orders/:id/status cancelled)
  order.paymentStatus = 'failed';
  // Giữ orderStatus = 'pending' để user có thể retry
  await order.save();

  emitOrderPaymentUpdated(order);

  return {
    ok: true,
    status: 'failed'
  };
}

exports.handleVnpayReturn = async (req, res) => {
  try {
    const { isValid, params } = verifyVnpayCallback(req.query);

    if (!isValid) {
      return res.redirect(
        buildFrontendReturnUrl({
          status: 'invalid',
          paymentStatus: 'failed',
          code: '97'
        })
      );
    }

    const order = await Order.findOne({ paymentRef: params.vnp_TxnRef });
    if (!order) {
      return res.redirect(
        buildFrontendReturnUrl({
          status: 'not-found',
          paymentStatus: 'failed',
          code: '01'
        })
      );
    }

    const result = await finalizeVnpayOrder(order, params);
    const status = result.status || 'failed';

    return res.redirect(
      buildFrontendReturnUrl({
        status,
        orderId: order._id,
        paymentStatus: order.paymentStatus,
        code: params.vnp_ResponseCode || '99'
      })
    );
  } catch (error) {
    console.error('handleVnpayReturn failed:', error);
    return res.redirect(
      buildFrontendReturnUrl({
        status: 'error',
        paymentStatus: 'failed',
        code: '99'
      })
    );
  }
};

exports.handleVnpayIpn = async (req, res) => {
  try {
    const { isValid, params } = verifyVnpayCallback(req.query);

    if (!isValid) {
      return res.status(200).json({ RspCode: '97', Message: 'Checksum failed' });
    }

    const order = await Order.findOne({ paymentRef: params.vnp_TxnRef });
    if (!order) {
      return res.status(200).json({ RspCode: '01', Message: 'Order not found' });
    }

    const result = await finalizeVnpayOrder(order, params);
    if (!result.ok) {
      return res.status(200).json({ RspCode: result.code || '99', Message: 'Invalid amount' });
    }

    if (result.alreadyProcessed) {
      return res.status(200).json({ RspCode: '02', Message: 'Order already confirmed' });
    }

    return res.status(200).json({ RspCode: '00', Message: 'Success' });
  } catch (error) {
    console.error('handleVnpayIpn failed:', error);
    return res.status(200).json({ RspCode: '99', Message: error.message || 'Unknown error' });
  }
};

/**
 * POST /orders/:orderId/retry-payment
 * Tạo lại VNPay payment URL mới cho đơn hàng đã thất bại.
 * - KHÔNG tạo đơn hàng mới
 * - KHÔNG thay đổi inventory (đã reserved từ trước)
 * - Chỉ cập nhật paymentRef mới và trả về paymentUrl mới
 */
exports.retryVnpayPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    // Chỉ cho phép chủ đơn hàng retry
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện thao tác này'
      });
    }

    // Chỉ cho phép retry khi phương thức là VNPAY và thanh toán chưa thành công
    if (order.paymentMethod !== 'VNPAY') {
      return res.status(400).json({
        success: false,
        message: 'Đơn hàng này không sử dụng VNPAY'
      });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Đơn hàng này đã được thanh toán thành công'
      });
    }

    if (order.orderStatus === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Đơn hàng đã bị hủy, không thể thanh toán lại'
      });
    }

    // Tạo paymentRef mới và URL mới, giữ nguyên đơn hàng và inventory
    const newPaymentRef = createVnpayTxnRef();
    const clientIp = req.headers['x-forwarded-for']
      || req.connection?.remoteAddress
      || req.socket?.remoteAddress
      || '127.0.0.1';

    const { paymentUrl, expireDate } = buildVnpayPaymentUrl({
      amount: order.totalAmount,
      ipAddr: normalizeIp(clientIp),
      txnRef: newPaymentRef,
      orderInfo: `Thanh toan lai don hang ${order._id}`
    });

    // Cập nhật paymentRef mới và reset trạng thái về pending
    order.paymentRef = newPaymentRef;
    order.paymentStatus = 'pending';
    order.paymentUrlExpiresAt = new Date(
      `${expireDate.slice(0, 4)}-${expireDate.slice(4, 6)}-${expireDate.slice(6, 8)}T${expireDate.slice(8, 10)}:${expireDate.slice(10, 12)}:${expireDate.slice(12, 14)}+07:00`
    );
    await order.save();

    return res.status(200).json({
      success: true,
      message: 'Tạo lại link thanh toán thành công',
      paymentUrl
    });
  } catch (error) {
    console.error('retryVnpayPayment failed:', error);

    if (error.message === 'VNPAY config is missing') {
      return res.status(400).json({
        success: false,
        message: 'VNPay chưa được cấu hình trên backend'
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || 'Có lỗi khi tạo lại link thanh toán'
    });
  }
};
