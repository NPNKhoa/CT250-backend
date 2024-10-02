import { Promotion } from '../models/product.model.js';
import { isValidObjectId } from '../utils/isValidObjectId.js';
import logError from '../utils/logError.js';
import { parseISO, isFuture, isValid } from 'date-fns';

export const getAllPromotions = async (req, res) => {
  try {
    const { promotionName = '', page = 1, limit = 10 } = req.query;

    const query = {};

    if (promotionName) {
      query.promotionName = { $regex: promotionName, $options: 'i' };
    }

    const promotionQuery = Promotion.find(query)
      .populate('productIds', 'productName price')
      .populate('serviceIds', 'serviceName servicePrice');

    if (parseInt(limit) !== -1) {
      promotionQuery.skip((page - 1) * limit).limit(parseInt(limit));
    }

    const promotions = await promotionQuery;

    if (!Array.isArray(promotions) || promotions.length === 0) {
      return res.status(404).json({
        error: 'Promotion not found',
      });
    }

    const totalDocs = await Promotion.countDocuments(query);
    const totalPages = parseInt(limit) === -1 ? 1 : Math.ceil(totalDocs / limit);

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
    console.log(promotionId);

    if (!promotionId || !isValidObjectId(promotionId)) {
      return res.status(400).json({
        error: 'Invalid Id',
      });
    }

    const promotion = await Promotion.findById(promotionId)
      .populate('productIds', 'productName price')
      .populate('serviceIds', 'serviceName servicePrice');

    if (!promotion) {
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
    const { promotionStartDate, promotionExpiredDate, productIds = [], serviceIds = [] } = req.body;

    if (!promotionStartDate || !promotionExpiredDate) {
      return res.status(400).json({
        error: 'Missing required field',
      });
    }

    const startDate = parseISO(promotionStartDate);

    if (!isValid(startDate)) {
      return res.status(400).json({
        error: 'Invalid date format for promotionStartDate',
      });
    }

    const expiredDate = parseISO(promotionExpiredDate);

    if (!isValid(expiredDate)) {
      return res.status(400).json({
        error: 'Invalid date format for promotionExpiredDate',
      });
    }

    if (!isFuture(expiredDate)) {
      return res.status(400).json({
        error: 'Promotion expiration date must be a future date',
      });
    }

    const existingPromotion = await Promotion.findOne({
      productIds,
      serviceIds,
      promotionStartDate: startDate,
      promotionExpiredDate: expiredDate,
    });

    if (existingPromotion) {
      return res.status(409).json({
        error: 'This promotion is already exist!',
      });
    }

    const newPromotion = await Promotion.create({
      promotionStartDate: startDate,
      promotionExpiredDate: expiredDate,
      productIds,
      serviceIds,
    });

    const populatedPromotion = await Promotion.findById(newPromotion._id)
      .populate('productIds', 'productName price')
      .populate('serviceIds', 'serviceName servicePrice');

    res.status(201).json({
      data: populatedPromotion,
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
      return res.status(400).json({ error: 'Invalid Id' });
    }

    const { promotionStartDate, promotionExpiredDate, productIds = [], serviceIds = [] } = req.body;

    if (!promotionStartDate || !promotionExpiredDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const startDate = parseISO(promotionStartDate);
    const expiredDate = parseISO(promotionExpiredDate);

    if (!isValid(startDate) || !isValid(expiredDate)) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    if (!isFuture(expiredDate)) {
      return res.status(400).json({ error: 'Promotion expiration date must be a future date' });
    }

    const existingPromotion = await Promotion.findOne({
      _id: { $ne: promotionId },
      productIds,
      serviceIds,
      promotionStartDate: startDate,
      promotionExpiredDate: expiredDate,
    });

    if (existingPromotion) {
      return res.status(409).json({ error: 'This promotion already exists!' });
    }

    const updatedPromotion = await Promotion.findByIdAndUpdate(
      promotionId,
      { productIds, serviceIds, promotionStartDate: startDate, promotionExpiredDate: expiredDate },
      { new: true, runValidators: true }
    );

    if (!updatedPromotion) {
      return res.status(404).json({ error: 'Promotion not found' });
    }

    const populatedPromotion = await Promotion.findById(updatedPromotion._id)
      .populate('productIds', 'productName price')
      .populate('serviceIds', 'serviceName servicePrice');

    res.status(200).json({ data: populatedPromotion, error: false });
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
