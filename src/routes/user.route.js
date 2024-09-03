import express from 'express';
import {
  getAllUsers,
  getLoggedInUser,
  getUserById,
  updatePassword,
  updateUserInfo,
} from '../controllers/user.controller.js';
import { auth } from '../middlewares/authentication.js';

const router = express.Router();

router.get('/:id', getUserById);

router.get('/', getAllUsers);

router.get('/me', auth, getLoggedInUser);

router.put('/', auth, updateUserInfo);

router.put('/update-password', auth, updatePassword);

export default router;
