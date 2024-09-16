import express from 'express';

import { auth } from '../middlewares/authentication.js';
import {
  createOrder,
  getAllOrders,
  getOrderByUser,
} from '../controllers/order.controller.js';

const router = express.Router();

router.get('/', getAllOrders);

router.get('/get-order-by-user', auth, getOrderByUser);

router.post('/', auth, createOrder);

// router.put('/:id', );

// router.delete('/:id', );

export default router;
