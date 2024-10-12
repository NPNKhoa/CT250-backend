import { PriceFilter, SystemConfig } from '../models/systemConfig.model.js';
import { isValidObjectId } from '../utils/isValidObjectId.js';
import logError from '../utils/logError.js';

export const getAllPriceFiler = async (_, res) => {
  try {
    const priceFilters = await PriceFilter.find().sort({ toPrice: 1 });

    if (Array.isArray(priceFilters) && priceFilters.length === 0) {
      return res.status(404).json({
        error: 'Not found price filter',
      });
    }

    res.status(200).json({
      data: priceFilters,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const createPriceFilter = async (req, res) => {
  try {
    const { fromPrice, toPrice } = req.body;

    if (fromPrice && !fromPrice.toString()) {
      return res.status(400).json({
        error: 'Missing required field',
      });
    }

    if (!isNaN(fromPrice) && fromPrice < 0) {
      return res.status(400).json({
        error: 'From Price must be a number greater than 0',
      });
    }

    if (toPrice && !isNaN(toPrice) && toPrice < fromPrice) {
      return res.status(400).json({
        error: 'To Price must be a number greater than or equal From Price',
      });
    }

    const existingPriceFilter = await PriceFilter.findOne({
      $and: [{ fromPrice }, { toPrice }],
    });

    if (existingPriceFilter) {
      return res.status(409).json({
        error: 'A price filter with either fromPrice or toPrice already exists',
      });
    }

    const overlappingFilter = await PriceFilter.findOne({
      $or: [
        {
          fromPrice: { $lt: toPrice },
          toPrice: { $gt: fromPrice },
        },
      ],
    });

    if (overlappingFilter) {
      return res.status(409).json({
        error: 'The price range conflicts with an existing filter',
      });
    }

    const newPriceFilter = await PriceFilter.create({
      fromPrice,
      toPrice: toPrice,
    });

    const systemConfig = await SystemConfig.findOne({ isChoose: true });

    if (systemConfig) {
      systemConfig.shopPriceFilter.push(newPriceFilter._id);
      await systemConfig.save();
    } else {
      return res.status(500).json({
        error: 'No SystemConfig found',
      });
    }

    res.status(201).json({
      data: newPriceFilter,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const updatePriceFilter = async (req, res) => {
  try {
    const { id } = req.params;

    if (id && !isValidObjectId(id)) {
      return res.status(400).json({
        error: 'Invalid id',
      });
    }

    const { fromPrice, toPrice } = req.body;

    const updatedPriceFilter = await PriceFilter.findByIdAndUpdate(
      id,
      { fromPrice, toPrice },
      { new: true, runValidators: true }
    );

    if (!updatedPriceFilter) {
      return res.status(404).json({
        error: 'Not found',
      });
    }

    res.status(200).json({
      data: updatedPriceFilter,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const deletePriceFilter = async (req, res) => {
  try {
    const { id } = req.params;

    if (id && !isValidObjectId(id)) {
      return res.status(400).json({
        error: 'Invalid id',
      });
    }

    const deletedPriceFilter = await PriceFilter.findByIdAndDelete(id);

    if (!deletedPriceFilter) {
      return res.status(404).json({
        error: 'Not found',
      });
    }

    res.status(200).json({
      data: deletedPriceFilter,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};
