import express from 'express';
import {
  createPriceFilter,
  deletePriceFilter,
  getAllPriceFiler,
  updatePriceFilter,
} from '../controllers/priceFilter.controller.js';

const router = express.Router();

router.get('/', getAllPriceFiler);

router.post('/', createPriceFilter);

router.put('/:id', updatePriceFilter);

router.delete('/:id', deletePriceFilter);

export default router;
