import express from 'express';
import {
  createComment,
  getAllProductComment,
} from '../controllers/comment.controller.js';
import { auth } from '../middlewares/authentication.js';

const router = express.Router();

router.get('/by-product', getAllProductComment);

router.post('/', auth, createComment);

export default router;
