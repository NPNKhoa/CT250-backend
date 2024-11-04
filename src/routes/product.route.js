import express from 'express';
import {
  addProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  uploadImage,
  find,
} from '../controllers/product.controller.js';
import upload from '../configs/multerConfig.js';

const router = express.Router();

router.get('/find', find);

router.get('/:id', getProductById);

router.get('/', getAllProducts);

router.post('/', upload.array('productImagePath'), addProduct);

router.post('/upload-image', upload.array('images'), uploadImage);

router.put('/:id', updateProduct);

router.delete('/:id', deleteProduct);

export default router;
