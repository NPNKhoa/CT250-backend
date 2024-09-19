import express from 'express';

import { auth } from '../middlewares/authentication.js';
import {
  createOrder,
  getAllOrders,
  getOrderById,
  getOrderByPhoneNumber,
  getOrderByUser,
} from '../controllers/order.controller.js';

const router = express.Router();

router.get('/', getAllOrders);

router.get('/:id', getOrderById);

router.get('/by-phone', getOrderByPhoneNumber);

router.get('/get-order-by-user', auth, getOrderByUser);

router.post('/', auth, createOrder);

export default router;
