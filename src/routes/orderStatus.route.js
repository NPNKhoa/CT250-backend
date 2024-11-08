import express from 'express';
import {
  cancelPendingOrdersOverdue,
  createOrderStatus,
  deleteOrderStatus,
  getAllOrderStatus,
  getOrderStatusById,
  getPendingOrdersOverdue,
  updateOrderStatus,
} from '../controllers/orderStatus.controller.js';

const router = express.Router();

router.get('/', getAllOrderStatus);
router.put('/', cancelPendingOrdersOverdue);
router.get('/hehe', getPendingOrdersOverdue);

router.get('/:id', getOrderStatusById);

router.post('/', createOrderStatus);

router.put('/:id', updateOrderStatus);

router.delete('/:id', deleteOrderStatus);

export default router;
