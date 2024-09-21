import express from 'express';
import {
    addServices,
    getAllServices,
    getServiceById,
    updateService,
    deleteService,
    deleteAllServices,
} from '../controllers/service.controller.js';

const router = express.Router();

router.get('/', getAllServices);

router.get('/:id', getServiceById);

router.post('/', addServices);

router.put('/:id', updateService);

router.delete('/:id', deleteService);

router.delete('/', deleteAllServices);

export default router;
