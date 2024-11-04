import express from 'express';
import {
    addArticles,
    getAllArticles,
    getArticleById,
    updateArticle,
    deleteArticle,
    deleteAllArticles,
} from '../controllers/article.controller.js';

const router = express.Router();

router.get('/', getAllArticles);

router.get('/:id', getArticleById);

router.post('/', addArticles);

router.put('/:id', updateArticle);

router.delete('/:id', deleteArticle);

router.delete('/', deleteAllArticles);

export default router;
