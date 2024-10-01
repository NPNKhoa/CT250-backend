import mongoose from 'mongoose';

import { User } from '../models/user.model.js';
import { UserVoucher, Voucher } from '../models/voucher.model.js';
import { isValidObjectId } from '../utils/isValidObjectId.js';

import logError from '../utils/logError.js';

export const getAllVouchers = async (req, res) => {
  try {
    const { page = 1, limit = 10, latest = true, status } = req.query;
    const parsedLimit = parseInt(limit);

    const query = {};
    let sortOptions = {};

    if (status === 'expired') {
      query.expiredDate = { $lt: Date.now() };
    }

    if (status === 'inProgress') {
      query.expiredDate = { $gt: Date.now() };
    }

    if (latest === 'true' || latest === true) {
      sortOptions = { createdAt: -1 };
    }

      let vouchers;
      if (parsedLimit === -1) {
          vouchers = await Voucher.find(query)
              .sort(sortOptions);
      } else {
          vouchers = await Voucher.find(query)
              .sort(sortOptions)
              .skip((page - 1) * parsedLimit)
              .limit(parsedLimit);
      }

    if (Array.isArray(vouchers) && vouchers.length === 0) {
      return res.status(404).json({
        error: 'Not found Voucher',
      });
    }

    const totalDocs = await Voucher.countDocuments(query);
    const totalPages = parsedLimit === -1 ? 1 : Math.ceil(totalDocs / parsedLimit);

    res.status(200).json({
      data: vouchers,
      meta: {
        totalDocs,
        totalPages,
        currentPage: page,
        limit,
      },
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const getVoucherById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({
        error: 'Invalid id',
      });
    }

    const voucher = await Voucher.findById(id);

    if (!voucher) {
      return res.status(404).json({
        error: 'Not found',
      });
    }

    res.status(200).json({
      data: voucher,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const createVoucher = async (req, res) => {
  try {
    const {
      voucherCode,
      voucherName,
      voucherType,
      discountPercent,
      startDate,
      expiredDate,
      maxUsage,
    } = req.body;

    if (!voucherCode || !voucherName || !voucherType || !discountPercent) {
      return res.status(400).json({
        error: 'Missing fields',
      });
    }

    if (voucherType === 'public' && !maxUsage) {
      return res.status(400).json({
        error: 'Missing maxUsage',
      });
    }

    const existingVoucher = await Voucher.findOne({ voucherCode });

    if (existingVoucher) {
      return res.status(409).json({
        error: 'This voucher code already exist',
      });
    }

    console.log(voucherType);

    if (!['public', 'private'].includes(voucherType)) {
      return res.status(400).json({
        error: 'Invalid voucherType',
      });
    }

    if (
      !isNaN(+discountPercent) &&
      (+discountPercent < 0 || +discountPercent > 100)
    ) {
      return res.status(400).json({
        error: 'Discount percent must be in range [0, 100]',
      });
    }

    if (!isNaN(+maxUsage) && +maxUsage <= 0) {
      return res.status(400).json({
        error: 'Max Usage must be a number greater than 0',
      });
    }

    const createdVoucher = await Voucher.create({
      voucherCode,
      voucherName,
      voucherType,
      discountPercent,
      startDate,
      expiredDate,
      maxUsage,
    });

    res.status(201).json({
      data: createdVoucher,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const updateVoucher = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({
        error: 'Invalid id',
      });
    }

    const existingVoucher = await Voucher.findById(id);

    if (!existingVoucher) {
      return res.status(404).json({
        error: 'Not found voucher',
      });
    }

    const {
      voucherCode,
      voucherName,
      voucherType,
      discountPercent,
      startDate,
      expiredDate,
      maxUsage,
    } = req.body;

    if (
      voucherType &&
      (voucherType !== 'public' || voucherType !== 'private')
    ) {
      return res.status(400).json({
        error: 'Invalid voucherType',
      });
    }

    if (
      !isNaN(+discountPercent) &&
      (+discountPercent < 0 || +discountPercent > 100)
    ) {
      return res.status(400).json({
        error: 'Discount percent must be in range [0, 100]',
      });
    }

    if (!isNaN(+maxUsage) && +maxUsage <= 0) {
      return res.status(400).json({
        error: 'Max Usage must be a number greater than 0',
      });
    }

    const newVoucher = {
      voucherCode: voucherCode || existingVoucher.voucherCode,
      voucherName: voucherName || existingVoucher.voucherName,
      voucherType: voucherType || existingVoucher.voucherType,
      discountPercent: discountPercent || existingVoucher.discountPercent,
      startDate: startDate || existingVoucher.startDate,
      expiredDate: expiredDate || existingVoucher.expiredDate,
      maxUsage: maxUsage || existingVoucher.maxUsage,
    };

    const updatedVoucher = await Voucher.findByIdAndUpdate(id, newVoucher, {
      new: true,
      runValidators: true,
    });

    if (!updatedVoucher) {
      return res.status(404).json({
        error: 'Not found',
      });
    }

    res.status(200).json({
      data: updatedVoucher,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const deleteVoucher = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({
        error: 'Invalid id',
      });
    }

    const deletedVoucher = await Voucher.findByIdAndDelete(id);

    if (!deletedVoucher) {
      return res.status(404).json({
        error: 'Not found',
      });
    }

    res.sendStatus(204);
  } catch (error) {
    logError(error, res);
  }
};

export const collectVoucher = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { userId } = req.userId;

    if (!userId) {
      return res.status(400).json({
        error: 'Missing userId',
      });
    }

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        error: 'Invalid userId format',
      });
    }

    const existingUser = await User.findById(userId).session(session);

    if (!existingUser) {
      return res.status(404).json({
        error: 'Not found user',
      });
    }

    const { voucherId } = req.body;

    if (!voucherId) {
      return res.status(400).json({
        error: 'Missing voucherId',
      });
    }

    if (!isValidObjectId(voucherId)) {
      return res.status(400).json({
        error: 'Invalid voucherId format',
      });
    }

    const existingVoucher = await Voucher.findById(voucherId).session(session);

    if (!existingVoucher) {
      return res.status(404).json({
        error: 'Not found voucher',
      });
    }

    if (existingVoucher.expiredDate.getTime() < Date.now()) {
      return res.status(400).json({
        error: 'Voucher expired!',
      });
    }

    if (
      existingVoucher.type === 'public' &&
      existingVoucher.maxUsage <= existingVoucher.collectedCount
    ) {
      return res.status(400).json({
        error: 'Voucher reach max usage',
      });
    }

    const userCollected = await UserVoucher.findOne({
      userId,
      voucherId,
    }).session(session);

    if (userCollected) {
      return res.status(409).json({
        error: 'Already collected',
      });
    }

    const updatedVoucher = await Voucher.findOneAndUpdate(
      { _id: voucherId, collectedCount: { $lt: existingVoucher.maxUsage } },
      { $inc: { collectedCount: 1 } },
      { new: true, session }
    );

    if (!updatedVoucher) {
      res.status(400).json({
        error: 'Voucher getting max count',
      });
    }

    const newUserVoucher = await UserVoucher.create(
      {
        userId,
        voucherId,
        collectedAt: Date.now(),
      },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    const populatedUserVoucher = await UserVoucher.findById(newUserVoucher._id)
      .populate('userId')
      .populate('voucherId');

    res.status(200).json({
      data: populatedUserVoucher,
      error: false,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    logError(error, res);
  }
};

export const getPublishingVoucher = async (req, res) => {
  try {
    const query = {
      expiredDate: { $gt: new Date() },
      $expr: { $gt: ['$maxUsage', '$collectedCount'] },
    };

    const publishingVouchers = await Voucher.find(query).sort({
      collectedCount: -1,
    });

    if (Array.isArray(publishingVouchers) && publishingVouchers.length === 0) {
      return res.status(404).json({
        error: 'Not found',
      });
    }

    res.status(200).json({
      data: publishingVouchers,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};
