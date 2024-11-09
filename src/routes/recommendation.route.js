import express from 'express';
import {
  recomendationByRating,
  recomendationNewProduct,
  recomendationSimilarProduct,
  suggestProductForUser,
} from '../controllers/recommendation.controller.js';

import { auth } from '../middlewares/authentication.js';

const router = express.Router();

router.get('/rating', recomendationByRating);

router.get('/new', recomendationNewProduct);

router.get('/for-user', auth, suggestProductForUser);

router.post('/similar', recomendationSimilarProduct);

export default router;
