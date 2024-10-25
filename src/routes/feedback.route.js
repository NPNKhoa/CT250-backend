import express from 'express';
import {
  createFeedback,
  getLatestFeedback,
} from '../controllers/feedback.controller.js';

const router = express.Router();

router.post('/', createFeedback);
router.get('/latest', getLatestFeedback);

export default router;
