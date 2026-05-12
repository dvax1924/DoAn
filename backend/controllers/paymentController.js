const Order = require('../models/Order');
const { io } = require('../socket');
const { releaseOrderInventory } = require('../services/orderService');
const { verifyVnpayCallback, buildFrontendReturnUrl } = require('../utils/vnpay');

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

  order.paymentStatus = 'failed';
  order.orderStatus = 'cancelled';
  await releaseOrderInventory(order);
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
