import express from 'express';
import {
  addSpecification,
  deleteSpecification,
  getAllSpecifications,
  getSpecificationById,
  updateSpecification,
} from '../controllers/specification.controller';

const router = express.Router();

router.get('/:id', getSpecificationById);

router.get('/', getAllSpecifications);

router.post('/', addSpecification);

router.put('/:id', updateSpecification);

router.delete(':/id', deleteSpecification);

export default router;
