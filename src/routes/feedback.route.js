import express from 'express';
import {
  checkIfLoyalCustomer,
  createFeedback,
  getAllFeedback,
  getLatestFeedback,
  replyEmail,
} from '../controllers/feedback.controller.js';

const router = express.Router();

router.post('/', createFeedback);

router.get('/latest', getLatestFeedback);

router.get('/all', getAllFeedback);

router.get('/check', checkIfLoyalCustomer);

router.post('/reply', replyEmail);

export default router;
