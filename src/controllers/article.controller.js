import logError from '../utils/logError.js';
import Article from '../models/article.model.js';
import { isValidObjectId } from '../utils/isValidObjectId.js';

export const addArticles = async (req, res) => {
    try {
        const { title, thumbnail, content } = req.body;

        if (!title || !thumbnail || !content) {
            return res.status(400).json({
                error: 'Missing required fields!',
            });
        }

        const existingArticle = await Article.findOne({ title });

        if (existingArticle) {
            return res.status(409).json({
                error: 'Article is already exist!',
            });
        }

        const newArticle = await Article.create({
            title,
            thumbnail,
            content
        });

        res.status(201).json({
            data: newArticle,
            error: false,
        });
    } catch (error) {
        logError(error, res);
    }
};

export const getAllArticles = async (req, res) => {
    try {
        const { title = '', page = 1, limit = 10 } = req.query;
        const parsedLimit = parseInt(limit);

        const query = {};

        if (title) {
            query.title = { $regex: title, $options: 'i' };
        }


        const articles = await Article.find(query)
            .skip((page - 1) * parsedLimit)
            .limit(parsedLimit);


        if (!Array.isArray(articles) || articles.length === 0) {
            return res.status(404).json({
                error: 'Not found articles!',
            });
        }

        const totalDocs = await Article.countDocuments(query);
        const totalPage = Math.ceil(totalDocs / parsedLimit);

        res.status(200).json({
            data: articles,
            totalDocs,
            totalPage,
            error: false,
        });
    } catch (error) {
        logError(error, res);
    }
};

export const getArticleById = async (req, res) => {
    try {
        const { id: articleId } = req.params;

        if (!articleId || !isValidObjectId(articleId)) {
            return res.status(400).json({
                error: 'Invalid id',
            });
        }

        const article = await Article.findById(articleId);

        if (!article) {
            return res.status(404).json({
                error: 'Article not found!',
            });
        }

        res.status(200).json({
            data: article,
            error: false,
        });
    } catch (error) {
        logError(error, res);
    }
};

export const updateArticle = async (req, res) => {
    try {
        const { id: articleId } = req.params;
        const { title = '', thumbnail = '', content = '' } = req.body;

        if (!articleId || !isValidObjectId(articleId)) {
            return res.status(400).json({
                error: 'Invalid id',
            });
        }

        const article = await Article.findById(articleId);

        if (!article) {
            return res.status(404).json({
                error: 'Article not found!',
            });
        }

        if (title) article.title = title;
        if (thumbnail) article.thumbnail = thumbnail;
        if (content) article.content = content;        

        await article.save();

        res.status(200).json({
            data: article,
            error: false,
        });
    } catch (error) {
        logError(error, res);
    }
};

export const deleteArticle = async (req, res) => {
    try {
        const { id: articleId } = req.params;

        if (!articleId || !isValidObjectId(articleId)) {
            return res.status(400).json({
                error: 'Invalid id',
            });
        }

        const article = await Article.findByIdAndDelete(articleId);

        if (!article) {
            return res.status(404).json({
                error: 'Article not found!',
            });
        }

        res.status(200).json({
            message: 'Promotion deleted successfully!',
            error: false,
        });
    } catch (error) {
        logError(error, res);
    }
};

export const deleteAllArticles = async (req, res) => {
    try {
        await Article.deleteMany();

        res.status(200).json({
            error: false,
        });
    } catch (error) {
        logError(error, res);
    }
};