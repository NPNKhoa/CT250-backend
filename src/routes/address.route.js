import express from 'express';
import {
  deleteAddress,
  getAddressById,
  getUserAddress,
  updateAddress,
} from '../controllers/user.controller.js';

const router = express.Router();

router.get('/:id', getAddressById);

router.get('/', getUserAddress);

router.put('/update-address/:id', updateAddress);

router.delete('/address/:id', deleteAddress);

export default router;
