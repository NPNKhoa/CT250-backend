import express from 'express';
import {
  createCategory,
  deleteCategory,
  getAllCategory,
} from '../controllers/category.controller.js';

const router = express.Router();

router.get('/', getAllCategory);

router.post('/', createCategory);

router.delete('/:id', deleteCategory);

export default router;
