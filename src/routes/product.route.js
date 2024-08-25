import express from 'express';
import {
  addProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from '../controllers/product.controller.js';
import upload from '../configs/multerConfig.js';

const router = express.Router();

router.get('/:id', getProductById);

router.get('/', getAllProducts);

router.post('/', upload.array('productImagePath'), addProduct);

router.put('/:id', updateProduct);

router.delete('/:id', deleteProduct);

export default router;
