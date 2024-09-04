import express from 'express';

import {
  createAddress,
  deleteAddress,
  getAddressById,
  getUserAddress,
  updateAddress,
} from '../controllers/address.controller.js';
import { auth } from '../middlewares/authentication.js';

const router = express.Router();

router.get('/:id', getAddressById);

router.get('/', auth, getUserAddress);

router.post('/', auth, createAddress);

router.put('/update-address/:id', updateAddress);

router.delete('/address/:id', deleteAddress);

export default router;
