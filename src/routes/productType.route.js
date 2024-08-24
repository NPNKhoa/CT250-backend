import express from 'express';
import {
  addType,
  deleteType,
  getAllTypes,
  getTypeById,
  updateType,
} from '../controllers/productType.controller';

const router = express.Router();

router.get('/:id', getTypeById);

router.get('/', getAllTypes);

router.post('/', addType);

router.put('/:id', updateType);

router.delete('/:id', deleteType);

export default router;
