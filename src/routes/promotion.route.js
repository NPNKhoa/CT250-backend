import express from 'express';
import {
  addPromotion,
  deletePromotion,
  getAllPromotions,
  getPromotionById,
  updatePromotion,
} from '../controllers/promotion.controller.js';

const router = express.Router();

router.get('/:id', getPromotionById);

router.get('/', getAllPromotions);

router.post('/', addPromotion);

router.put('/:id', updatePromotion);

router.delete('/:id', deletePromotion);

export default router;
