import moment from 'moment';
import QueryString from 'qs';

import sortObject from '../utils/sortObject.js';
import createHmacSignature from '../utils/createHmacSignature.js';

import { Order } from '../models/order.model.js';

export const generatePaymentUrl = ({ orderId, amount, ipAddr, locale }) => {
  process.env.TZ = 'Asia/Ho_Chi_Minh';

  const date = new Date();
  const createDate = moment(date).format('YYYYMMDDHHmmss');

  const env = process.env;

  const tmnCode = env.VNP_TMN_CODE;
  const secretKey = env.VNP_HASH_SECRET;
  const returnUrl = env.VNP_RETURN_URL;

  let vnpUrl = env.VNP_API_URL;

  const currCode = 'VND';
  const calculatedAmount = +amount * 100;
  const orderType = 160000;

  const orderInfo = `Thanh toan cho ma giao dich: ${orderId}. So tien: ${amount
    .toLocaleString('vi-VN', {
      style: 'currency',
      currency: 'VND',
    })
    .replace('₫', 'đ')}`;

  const vnpParams = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: tmnCode,
    vnp_Locale: locale,
    vnp_CurrCode: currCode,
    vnp_TxnRef: `${orderId}-${moment(date).format('YYYYMMDDHHmmss')}`,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: orderType,
    vnp_Amount: calculatedAmount,
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: createDate,
  };

  console.log(vnpParams['vnp_ReturnUrl']);

  const sortedParams = sortObject(vnpParams);

  const signData = QueryString.stringify(sortedParams, { encode: false });
  const signed = createHmacSignature(signData, secretKey);

  sortedParams['vnp_SecureHash'] = signed;

  vnpUrl += '?' + QueryString.stringify(sortedParams, { encode: false });

  return vnpUrl;
};

export const handlePaymentReturn = async (vnpParams) => {
  console.log(vnpParams);

  const secureHash = vnpParams['vnp_SecureHash'];

  delete vnpParams['vnp_SecureHash'];
  delete vnpParams['vnp_SecureHashType'];

  vnpParams = sortObject(vnpParams);

  const secretKey = process.env.VNP_HASH_SECRET;

  const orderId = vnpParams['vnp_TxnRef'].split('-')[0];

  const signData = QueryString.stringify(vnpParams, { encode: false });
  const signed = createHmacSignature(signData, secretKey);

  if (secureHash !== signed) {
    return {
      success: false,
      message: 'Invalid Sign',
      vnp_Code: 97,
    };
  }

  const vnp_RspCode = vnpParams['vnp_ResponseCode'];

  if (vnp_RspCode !== '00') {
    return {
      success: false,
      message: `Thanh toán thất bại, mã lỗi vnpay ${vnp_RspCode}`,
    };
  }

  const order = await Order.findById(orderId);

  if (!order) {
    return {
      success: false,
      message: 'Order not found',
      vnp_Code: '01',
    };
  }

  const vnp_Amount = parseInt(vnpParams['vnp_Amount'], 10) / 100;

  if (order.totalPrice !== vnp_Amount) {
    return {
      success: false,
      message: 'Amount does not match',
      vnp_Code: '04',
    };
  }

  await Order.findByIdAndUpdate(
    orderId,
    {
      paymentStatus: true,
      paidDate: new Date()
    },
    { new: true, runValidators: true }
  );

  return {
    success: true,
    vnp_Code: vnp_RspCode,
    message: 'Thanh toán thành công',
  };
};
