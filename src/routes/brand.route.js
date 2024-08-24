import express from 'express';
import {
  addBrand,
  deleteBrand,
  getAllBrands,
  getBrandById,
  updateBrand,
} from '../controllers/brand.controller.js';

const router = express.Router();

router.get('/', getAllBrands);

router.get('/:id', getBrandById);

router.post('/', addBrand);

router.put('/:id', updateBrand);

router.delete('/:id', deleteBrand);

export default router;
