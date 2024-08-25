import { parseISO, isFuture, isValid } from 'date-fns';

import { Discount } from '../models/product.model.js';
import { isValidObjectId } from '../utils/isValidObjectId.js';
import logError from '../utils/logError.js';

export const getAllDiscount = async (req, res) => {
  try {
    const { discountExpiredDate = null, page = 1, limit = 10 } = req.query;

    const query = {};

    if (discountExpiredDate) {
      query.discountExpiredDate = {
        $regex: discountExpiredDate,
        $options: 'i',
      };
    }

    const discounts = await Discount.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    if (!Array.isArray(discounts) || !discounts.length === 0) {
      return res.status(404).json({
        error: 'Discount not found!',
      });
    }

    const totalDocs = await Discount.countDocuments(query);
    const totalPages = Math.ceil(totalDocs / limit);

    res.status(200).json({
      data: discounts,
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

export const getDiscountById = async (req, res) => {
  try {
    const { id: discountId } = req.params;

    if (!discountId || !isValidObjectId(discountId)) {
      return res.status(400).json({
        error: 'Invalid id',
      });
    }

    const discount = await Discount.findById(discountId);

    if (!discount) {
      return res.status(404).json({
        error: 'Discount not found!',
      });
    }

    res.status(200).json({
      data: discount,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const addDiscount = async (req, res) => {
  try {
    const { discountPercent, discountExpiredDate } = req.body;

    if (!discountPercent === null || !discountExpiredDate) {
      return res.status(400).json({
        error: 'Missing required fields',
      });
    }

    if (
      typeof discountPercent !== 'number' ||
      discountPercent <= 0 ||
      discountPercent > 100
    ) {
      return res.status(400).json({
        error: 'Discount percent must be a number between 1 and 100',
      });
    }

    const expiredDate = parseISO(discountExpiredDate);

    if (!isValid(expiredDate)) {
      return res.status(400).json({
        error: 'Invalid date format for discountExpiredDate',
      });
    }

    if (!isFuture(expiredDate)) {
      return res.status(400).json({
        error: 'Discount expiration date must be a future date',
      });
    }

    const existingDiscount = await Discount.findOne({
      discountPercent,
      discountExpiredDate: expiredDate,
    });

    if (existingDiscount) {
      return res.status(409).json({
        error: 'This discount is already exist',
      });
    }

    const newDiscount = await Discount.create({
      discountPercent,
      discountExpiredDate: expiredDate,
    });

    res.status(201).json({
      data: newDiscount,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const updateDiscount = async (req, res) => {
  try {
    const { id: discountId } = req.params;

    if (!discountId || !isValidObjectId(discountId)) {
      return res.status(400).json({
        error: 'Invalid id',
      });
    }

    const { discountPercent, discountExpiredDate } = req.body;

    if (discountPercent === null || !discountExpiredDate) {
      return res.status(400).json({
        error: 'Missing required fields',
      });
    }

    if (
      typeof discountPercent !== 'number' ||
      discountPercent <= 0 ||
      discountPercent > 100
    ) {
      return res.status(400).json({
        error: 'Discount percent must be a number between 1 and 100',
      });
    }

    const expiredDate = parseISO(discountExpiredDate);

    if (!isValid(expiredDate)) {
      return res.status(400).json({
        error: 'Invalid date format for discountExpiredDate',
      });
    }

    if (!isFuture(expiredDate)) {
      return res.status(400).json({
        error: 'Discount expiration date must be a future date',
      });
    }

    const existingDiscount = await Discount.findOne({
      _id: { $ne: discountId },
      discountPercent,
      discountExpiredDate: expiredDate,
    });

    if (existingDiscount) {
      return res.status(409).json({
        error: 'This discount already exists',
      });
    }

    const updatedDiscount = await Discount.findByIdAndUpdate(
      discountId,
      {
        discountPercent,
        discountExpiredDate: expiredDate,
      },
      { new: true, runValidators: true }
    );

    if (!updatedDiscount) {
      return res.status(404).json({
        error: 'Discount not found',
      });
    }

    res.status(200).json({
      data: updatedDiscount,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const deleteDiscount = async (req, res) => {
  try {
    const { id: discountId } = req.params;

    if (!discountId || !isValidObjectId(discountId)) {
      return res.status(400).json({
        error: 'Invalid id',
      });
    }

    const deletedDiscount = await Discount.findByIdAndDelete(discountId);

    if (!deletedDiscount) {
      return res.status(404).json({
        error: 'Discount not found',
      });
    }

    res.status(200).json({
      message: 'Discount deleted successfully!',
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};
