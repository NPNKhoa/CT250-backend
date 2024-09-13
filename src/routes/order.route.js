import express from 'express';

import { auth } from '../middlewares/authentication.js';
import { createOrder } from '../controllers/order.controller.js';

const router = express.Router();

// router.get('/', );

router.post('/', auth, createOrder);

// router.put('/:id', );

// router.delete('/:id', );

export default router;
