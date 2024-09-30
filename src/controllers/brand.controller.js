import logError from '../utils/logError.js';

import { Brand } from '../models/product.model.js';
import { isValidObjectId } from '../utils/isValidObjectId.js';

export const addBrand = async (req, res) => {
  try {
    const { brandName, brandDesc } = req.body;

    if (!brandName || !brandDesc) {
      return res.status(400).json({
        error: 'Missing required fields!',
      });
    }

    const existingBrand = await Brand.findOne({ brandName });

    if (existingBrand) {
      return res.status(409).json({
        error: 'Brand is already exist!',
      });
    }

    const newBrand = await Brand.create({
      brandName,
      brandDesc,
    });

    res.status(201).json({
      data: newBrand,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const getAllBrands = async (req, res) => {
  try {
    const { brandName = '', page = 1, limit = 10 } = req.query;
    const parsedLimit = parseInt(limit);

    const query = {};

    if (brandName) {
      query.brandName = { $regex: brandName, $options: 'i' };
    }

    let brands;
    if (parsedLimit === -1) {
        brands = await Brand.find(query);
    } else {
        brands = await Brand.find(query)
            .skip((page - 1) * parsedLimit)
            .limit(parsedLimit);
    }

    if (!Array.isArray(brands) || brands.length === 0) {
      return res.status(404).json({
        error: 'Not found brands!',
      });
    }

    const totalDocs = await Brand.countDocuments(query);
    const totalPage = parsedLimit === -1 ? 1 : Math.ceil(totalDocs / parsedLimit);

    res.status(200).json({
      data: brands,
      error: false,
      meta: {
        totalDocs,
        totalPage,
        currentPage: page,
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    logError(error, res);
  }
};

export const getBrandById = async (req, res) => {
  try {
    const { id: brandId } = req.params;

    if (!brandId || !isValidObjectId(brandId)) {
      return res.status(400).json({
        error: 'Invalid Id',
      });
    }

    const existingBrand = await Brand.findById(brandId);

    if (!existingBrand) {
      return res.status(404).json({
        error: 'Not found brand!',
      });
    }

    res.status(200).json({
      data: existingBrand,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const updateBrand = async (req, res) => {
  try {
    const { id: brandId } = req.params;

    if (!brandId || !isValidObjectId(brandId)) {
      return res.status(400).json({
        error: 'Invalid Id',
      });
    }

    const { brandName = '', brandDesc = '' } = req.body;

    const existingBrand = await Brand.findOne({
      _id: { $ne: brandId },
      brandName,
    });

    if (existingBrand) {
      return res.status(409).json({
        error: 'This brand is already exist!',
      });
    }

    const updatedBrand = await Brand.findByIdAndUpdate(
      brandId,
      {
        brandName,
        brandDesc,
      },
      { new: true, runValidators: true } // return updated doc and run validators in schema
    );

    if (!updatedBrand) {
      return res.status(404).json({
        error: 'Brand not found',
      });
    }

    res.status(200).json({
      data: updatedBrand,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const deleteBrand = async (req, res) => {
  try {
    const { id: brandId } = req.params;

    if (!brandId || !isValidObjectId(brandId)) {
      return res.status(400).json({
        error: 'Invalid Id',
      });
    }

    const deletedBrand = await Brand.findByIdAndDelete(brandId);

    if (!deletedBrand) {
      return res.status(404).json({
        error: 'Brand not found',
      });
    }

    res.status(200).json({
      message: 'Brand deleted successfully',
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};
