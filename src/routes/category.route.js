import express from 'express';
import {
  createCategory,
  deleteCategory,
  getAllCategory,
  updateCategory,
} from '../controllers/category.controller.js';

const router = express.Router();

router.get('/', getAllCategory);

router.post('/', createCategory);

router.put('/:id', updateCategory);

router.delete('/:id', deleteCategory);

export default router;
