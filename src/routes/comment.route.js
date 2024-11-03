import express from 'express';
import {
  createComment,
  getAllComments,
  getAllProductComment,
} from '../controllers/comment.controller.js';
import { auth } from '../middlewares/authentication.js';

const router = express.Router();

router.get('/byproduct', getAllProductComment);
router.get('/all', getAllComments);

router.post('/', auth, createComment);

export default router;
