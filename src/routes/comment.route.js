import express from 'express';
import { createComment } from '../controllers/comment.controller.js';
import { auth } from '../middlewares/authentication.js';

const router = express.Router();

router.post('/', auth, createComment);

export default router;
