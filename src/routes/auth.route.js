import express from 'express';

import {
  addRole,
  getAllRoles,
  login,
  logout,
  refreshToken,
  signUp,
  loginWithGoogle,
} from '../controllers/auth.controller.js';

import upload from '../configs/multerConfig.js';
import { auth, isAdmin } from '../middlewares/authentication.js';

const router = express.Router();

router.post('/signup', upload.single('imageFile'), signUp);

router.post('/login', login);

router.post('/login-with-google', loginWithGoogle);

router.post('/refresh', refreshToken);

router.post('/logout', auth, logout);

router.post('/add-role', auth, isAdmin, addRole);

router.get('/roles', auth, isAdmin, getAllRoles);

export default router;
