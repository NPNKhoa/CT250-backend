import express from 'express';
import {
  deleteAddress,
  getAddressById,
  getAllUsers,
  getLoggedInUser,
  getUserAddress,
  getUserById,
  updateAddress,
  updatePassword,
  updateUserInfo,
} from '../controllers/user.controller.js';
import { auth } from '../middlewares/authentication.js';

const router = express.Router();

// User

router.get('/:id', getUserById);

router.get('/', getAllUsers);

router.get('/me', auth, getLoggedInUser);

router.put('/', auth, updateUserInfo);

router.put('/update-password', auth, updatePassword);

// Address

// router.get('/:id', getAddressById);

// router.get('/', getUserAddress);

// router.put('/update-address/:id', updateAddress);

// router.delete('/address/:id', deleteAddress);

export default router;
