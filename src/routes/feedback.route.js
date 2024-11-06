import express from 'express';
import {
  createFeedback,
  getAllFeedback,
  getLatestFeedback,
} from '../controllers/feedback.controller.js';

const router = express.Router();

router.post('/', createFeedback);
router.get('/latest', getLatestFeedback);
router.get('/all', getAllFeedback);

export default router;
