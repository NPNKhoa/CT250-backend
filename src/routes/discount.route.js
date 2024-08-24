import express from 'express';
import {
  addDiscount,
  deleteDiscount,
  getAllDiscount,
  getDiscountById,
  updateDiscount,
} from '../controllers/discount.controller';

const router = express.Router();

router.get('/:id', getDiscountById);

router.get('/', getAllDiscount);

router.post('/', addDiscount);

router.put('/:id', updateDiscount);

router.delete('/:id', deleteDiscount);

export default router;
