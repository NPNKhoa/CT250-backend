import express from 'express';

import {
  addRole,
  getAllRoles,
  login,
  logout,
  signUp,
} from '../controllers/auth.controller.js';
import upload from '../configs/multerConfig.js';

const router = express.Router();

router.post('/signup', upload.single('imageFile'), signUp);

router.post('/login', login);

router.post('/logout', logout);

router.post('/add-role', addRole);

router.get('/roles', getAllRoles);

export default router;
