import express from 'express';
import {
  addReply,
  createComment,
  deleteComment,
  getAllComments,
  getAllProductComment,
} from '../controllers/comment.controller.js';
import { auth } from '../middlewares/authentication.js';

const router = express.Router();

router.get('/byproduct', getAllProductComment);
router.get('/all', getAllComments);
router.post('/:reviewId', auth, addReply);
router.delete('/:reviewId', auth, deleteComment);

router.post('/', auth, createComment);

export default router;
