import express from 'express';
import {
  changeAvatar,
  getAllUsers,
  getLoggedInUser,
  getUserById,
  updatePassword,
  updateUserInfo,
} from '../controllers/user.controller.js';
import { auth } from '../middlewares/authentication.js';

import upload from '../configs/multerConfig.js';

const router = express.Router();

router.get('/me', auth, getLoggedInUser);

router.get('/:id', getUserById);

router.get('/', getAllUsers);

router.put('/', auth, updateUserInfo);

router.put('/update-password', auth, updatePassword);

router.put(
  '/update-avatar',
  upload.single('avatarImagePath'),
  auth,
  changeAvatar
);

export default router;
