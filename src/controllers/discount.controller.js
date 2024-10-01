import { parseISO, isFuture, isValid } from 'date-fns';

import { Discount } from '../models/product.model.js';
import { isValidObjectId } from '../utils/isValidObjectId.js';
import logError from '../utils/logError.js';

export const getAllDiscount = async (req, res) => {
  try {
    const { discountExpiredDate = null, page = 1, limit = 10 } = req.query;
    const parsedLimit = parseInt(limit);

    const query = {};

    if (discountExpiredDate) {
      query.discountExpiredDate = {
        $regex: discountExpiredDate,
        $options: 'i',
      };
    }

    let discounts;
    if (parsedLimit === -1) {
      discounts = await Discount.find(query);
    } else {
      discounts = await Discount.find(query)
        .skip((page - 1) * parsedLimit)
        .limit(parsedLimit);
    }

    if (!Array.isArray(discounts) || !discounts.length === 0) {
      return res.status(404).json({
        error: 'Discount not found!',
      });
    }

    const totalDocs = await Discount.countDocuments(query);
    const totalPages = parsedLimit === -1 ? 1 : Math.ceil(totalDocs / parsedLimit);

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
    const { discountPercent, discountExpiredDate, discountStartDate } =
      req.body;

    if (
      discountPercent === null ||
      discountExpiredDate === null ||
      discountStartDate === null
    ) {
      return res.status(400).json({
        error: 'Missing required fields',
      });
    }

    // Kiểm tra kiểu dữ liệu và giá trị của discountPercent
    if (
      typeof discountPercent !== 'number' ||
      discountPercent <= 0 ||
      discountPercent > 100
    ) {
      return res.status(400).json({
        error: 'Discount percent must be a number between 1 and 100',
      });
    }

    // Phân tích các ngày và kiểm tra tính hợp lệ
    const expiredDate = parseISO(discountExpiredDate);
    const startDate = parseISO(discountStartDate);

    if (!isValid(expiredDate)) {
      return res.status(400).json({
        error: 'Invalid date format for discountExpiredDate',
      });
    }

    if (!isValid(startDate)) {
      return res.status(400).json({
        error: 'Invalid date format for discountStartDate',
      });
    }

    if (!isFuture(expiredDate)) {
      return res.status(400).json({
        error: 'Discount expiration date must be a future date',
      });
    }

    if (!isFuture(startDate)) {
      return res.status(400).json({
        error: 'Discount start date must be a future date',
      });
    }

    // Kiểm tra xem discount đã tồn tại chưa
    const existingDiscount = await Discount.findOne({
      discountPercent,
      discountExpiredDate: expiredDate,
      discountStartDate: startDate,
    });

    if (existingDiscount) {
      return res.status(409).json({
        error: 'This discount already exists',
      });
    }

    // Tạo mới discount
    const newDiscount = await Discount.create({
      discountPercent,
      discountStartDate: startDate,
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

    const { discountPercent, discountExpiredDate, discountStartDate } = req.body;

    if (discountPercent === null || !discountExpiredDate || !discountStartDate) {
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
    const startDate = parseISO(discountStartDate);

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
      discountStartDate: startDate,
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
        discountStartDate: startDate,
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
