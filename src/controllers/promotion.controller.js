import { Promotion } from '../models/product.model.js';
import { isValidObjectId } from '../utils/isValidObjectId.js';
import logError from '../utils/logError.js';

export const getAllPromotions = async (req, res) => {
  try {
    const { promotionName = '', page = 1, limit = 10 } = req.body;

    const query = {};

    if (promotionName) {
      query.promotionName = { $regex: promotionName, $options: 'i' };
    }

    const promotions = await Promotion.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    if (!Array.isArray(promotions) || promotions.length === 0) {
      return res.status(404).json({
        error: 'Promotion not found',
      });
    }

    const totalDocs = await Promotion.countDocuments(query);
    const totalPages = Math.ceil(totalDocs / limit);

    res.status(200).json({
      data: promotions,
      error: false,
      meta: {
        totalDocs,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    logError(error, res);
  }
};

export const getPromotionById = async (req, res) => {
  try {
    const { id: promotionId } = req.params;

    if (!promotionId || !isValidObjectId(promotionId)) {
      return res.status(400).json({
        error: 'Invalid Id',
      });
    }

    const promotion = await Promotion.findById(promotionId);

    if (promotion) {
      return res.status(404).json({
        error: 'Promotion not found',
      });
    }

    res.status(200).json({
      data: promotion,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const addPromotion = async (req, res) => {
  try {
    const { promotionName } = req.body;

    if (!promotionName) {
      return res.status(400).json({
        error: 'Missing required field!',
      });
    }

    const existingPromotion = await Promotion.findOne({ promotionName });

    if (existingPromotion) {
      return res.status(409).json({
        error: 'Promotion is already exist',
      });
    }

    const newPromotion = await Promotion.create({ promotionName });

    res.status(201).json({
      data: newPromotion,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const updatePromotion = async (req, res) => {
  try {
    const { id: promotionId } = req.params;

    if (!promotionId || !isValidObjectId(promotionId)) {
      return res.status(400).json({
        error: 'Invalid Id',
      });
    }

    const { promotionName } = req.body;

    if (!promotionName) {
      return res.status(400).json({
        error: 'Missing required field',
      });
    }

    const existingPromotion = await Promotion.findOne({
      _id: { $ne: promotionId },
      promotionName,
    });

    if (existingPromotion) {
      return res.status(409).json({
        error: 'This promotion is already exist!',
      });
    }

    const updatedPromotion = await Promotion.findByIdAndUpdate(
      promotionId,
      {
        promotionName,
      },
      { new: true, runValidators: true }
    );

    if (!updatedPromotion) {
      return res.status(404).json({
        error: 'Promotion not found',
      });
    }

    res.status(200).json({
      data: updatedPromotion,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const deletePromotion = async (req, res) => {
  try {
    const { id: promotionId } = req.params;

    if (!promotionId || !isValidObjectId(promotionId)) {
      return res.status(400).json({
        error: 'Invalid Id',
      });
    }

    const deletedPromotion = await Promotion.findByIdAndDelete(promotionId);

    if (!deletedPromotion) {
      return res.status(404).json({
        error: 'Promotion not found',
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
