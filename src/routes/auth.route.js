import express from 'express';

import {
  addRole,
  getAllRoles,
  login,
  logout,
  refreshToken,
  signUp,
  loginWithSocial,
  verifyEmail,
  loginAdminPage,
  updateRole,
} from '../controllers/auth.controller.js';

import upload from '../configs/multerConfig.js';
import { auth, isAdmin } from '../middlewares/authentication.js';

const router = express.Router();

router.post('/signup', upload.single('imageFile'), signUp);

router.post('/login', login);

router.post('/loginadmin', loginAdminPage);

router.post('/login-with-social', loginWithSocial);

router.post('/refresh', refreshToken);

router.post('/logout', auth, logout);

router.put('/updaterole', auth, updateRole);

router.post('/add-role', auth, isAdmin, addRole);

router.get('/roles', auth, isAdmin, getAllRoles);

router.get('/verify-email', verifyEmail);

export default router;
