import express from 'express';
import {
  createPaymentMethod,
  deletePaymentMethod,
  getAllPaymentMethod,
  getPaymentMethodById,
  updatePaymentMethod,
} from '../controllers/paymentMethod.controller.js';

const router = express.Router();

router.get('/', getAllPaymentMethod);

router.get('/:id', getPaymentMethodById);

router.post('/', createPaymentMethod);

router.put('/:id', updatePaymentMethod);

router.delete('/:id', deletePaymentMethod);

export default router;
