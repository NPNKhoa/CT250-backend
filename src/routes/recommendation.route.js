import express from 'express';
import {
    recomendationByRating,
    recomendationNewProduct,
    recomendationSimilarProduct
} from '../controllers/recommendation.controller.js';

const router = express.Router();

router.get('/rating', recomendationByRating);

router.get('/new', recomendationNewProduct);

router.post('/similar', recomendationSimilarProduct);

export default router;
