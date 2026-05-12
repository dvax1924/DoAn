const crypto = require('crypto');
const moment = require('moment');
const qs = require('qs');

function getVnpayConfig() {
  const config = {
    tmnCode: process.env.VNPAY_TMN_CODE,
    hashSecret: process.env.VNPAY_HASH_SECRET,
    paymentUrl: process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    publicBackendUrl: process.env.PUBLIC_BACKEND_URL
  };

  if (!config.tmnCode || !config.hashSecret || !config.publicBackendUrl) {
    throw new Error('VNPAY config is missing');
  }

  return config;
}

function normalizeIp(rawIp) {
  if (!rawIp) return '127.0.0.1';

  let ip = Array.isArray(rawIp) ? rawIp[0] : String(rawIp);

  if (ip.includes(',')) {
    ip = ip.split(',')[0].trim();
  }

  if (ip.startsWith('::ffff:')) {
    ip = ip.replace('::ffff:', '');
  }

  if (ip === '::1') {
    return '127.0.0.1';
  }

  return ip;
}

function sortObjectForVnp(rawObject = {}) {
  const sorted = {};

  Object.keys(rawObject)
    .sort()
    .forEach((key) => {
      const rawValue = rawObject[key] === undefined || rawObject[key] === null
        ? ''
        : String(rawObject[key]);

      sorted[key] = encodeURIComponent(rawValue).replace(/%20/g, '+');
    });

  return sorted;
}

function createVnpayTxnRef() {
  return `VNP${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

function buildVnpayPaymentUrl({ amount, ipAddr, txnRef, orderInfo }) {
  const config = getVnpayConfig();
  const createDate = moment().format('YYYYMMDDHHmmss');
  const expireDate = moment().add(15, 'minutes').format('YYYYMMDDHHmmss');
  const normalizedAmount = Math.round(Number(amount || 0));

  if (!normalizedAmount || normalizedAmount <= 0) {
    throw new Error('Invalid order amount');
  }

  const params = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: config.tmnCode,
    vnp_Locale: 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: txnRef,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: 'other',
    vnp_Amount: String(normalizedAmount * 100),
    vnp_ReturnUrl: `${config.publicBackendUrl.replace(/\/$/, '')}/api/payments/vnpay/return`,
    vnp_IpAddr: normalizeIp(ipAddr),
    vnp_CreateDate: createDate,
    vnp_ExpireDate: expireDate
  };

  const sortedParams = sortObjectForVnp(params);
  const signData = qs.stringify(sortedParams, { encode: false });
  const secureHash = crypto
    .createHmac('sha512', config.hashSecret)
    .update(Buffer.from(signData, 'utf-8'))
    .digest('hex');

  sortedParams.vnp_SecureHash = secureHash;

  return {
    paymentUrl: `${config.paymentUrl}?${qs.stringify(sortedParams, { encode: false })}`,
    expireDate
  };
}

function verifyVnpayCallback(query = {}) {
  const config = getVnpayConfig();
  const params = { ...query };
  const secureHash = params.vnp_SecureHash;

  delete params.vnp_SecureHash;
  delete params.vnp_SecureHashType;

  const sortedParams = sortObjectForVnp(params);
  const signData = qs.stringify(sortedParams, { encode: false });
  const calculatedHash = crypto
    .createHmac('sha512', config.hashSecret)
    .update(Buffer.from(signData, 'utf-8'))
    .digest('hex');

  return {
    isValid: secureHash === calculatedHash,
    params
  };
}

function buildFrontendReturnUrl({ status, orderId, paymentStatus, code }) {
  const { frontendUrl } = getVnpayConfig();
  const redirectUrl = new URL('/payment/vnpay-return', frontendUrl);

  if (status) redirectUrl.searchParams.set('status', status);
  if (orderId) redirectUrl.searchParams.set('orderId', String(orderId));
  if (paymentStatus) redirectUrl.searchParams.set('paymentStatus', paymentStatus);
  if (code) redirectUrl.searchParams.set('code', code);

  return redirectUrl.toString();
}

module.exports = {
  getVnpayConfig,
  normalizeIp,
  createVnpayTxnRef,
  buildVnpayPaymentUrl,
  verifyVnpayCallback,
  buildFrontendReturnUrl
};
