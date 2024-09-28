import express from 'express';

import { auth } from '../middlewares/authentication.js';
import {
  // createOnlinePayment,
  createOrder,
  getAllOrders,
  getOrderById,
  getOrderByPhoneNumber,
  getOrderByUser,
  // vnpIpn,
  vnpReturn,
} from '../controllers/order.controller.js';

const router = express.Router();

router.get('/', getAllOrders);

router.get('/by-phone', getOrderByPhoneNumber);

router.get('/get-order-by-user', auth, getOrderByUser);

router.get('/payment/vnpay_return', vnpReturn);

// router.get('/payment/vnpay_ipn', vnpIpn);

router.get('/:id', getOrderById);

router.post('/', auth, createOrder);

// router.post('/payment/create_payment_url', createOnlinePayment);

export default router;
