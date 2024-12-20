import { ProductType } from '../models/product.model.js';
import { isValidObjectId } from '../utils/isValidObjectId.js';
import logError from '../utils/logError.js';

export const getAllTypes = async (req, res) => {
  try {
    const { type = '', page = 1, limit = 10 } = req.query;
    const parsedLimit = parseInt(limit);

    const query = {};

    if (type) {
      query.type = { $regex: type, $options: 'i' };
    }

    let productTypes;
    if (parsedLimit === -1) {
      productTypes = await ProductType.find(query);
    } else {
      productTypes = await ProductType.find(query)
        .skip((page - 1) * parsedLimit)
        .limit(parsedLimit);
    }

    if (!Array.isArray(productTypes) || productTypes.length === 0) {
      return res.status(404).json({
        error: 'Product types not found',
      });
    }

    const totalDocs = await ProductType.countDocuments(query);
    const totalPages = parsedLimit === -1 ? 1 : Math.ceil(totalDocs / parsedLimit);

    res.status(200).json({
      data: productTypes,
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

export const getTypeById = async (req, res) => {
  try {
    const { id: productTypeId } = req.params;

    if (!productTypeId || !isValidObjectId(productTypeId)) {
      return res.status(400).json({
        error: 'Invalid id',
      });
    }

    const productType = await ProductType.findById(productTypeId);

    if (!productType) {
      return res.status(404).json({
        error: 'Product type not found',
      });
    }

    res.status(200).json({
      data: productType,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const addType = async (req, res) => {
  try {
    const { productTypeName } = req.body;

    if (!productTypeName) {
      return res.status(400).json({
        error: 'Missing required fields',
      });
    }

    const existingProduct = await ProductType.findOne({ productTypeName });

    if (existingProduct) {
      return res.status(409).json({
        error: 'This product type is already exist',
      });
    }

    const createdProductType = await ProductType.create({
      productTypeName,
    });

    res.status(201).json({
      data: createdProductType,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const updateType = async (req, res) => {
  try {
    const { id: productTypeId } = req.params;

    if (!productTypeId || !isValidObjectId(productTypeId)) {
      return res.status(400).json({
        error: 'Invalid id',
      });
    }

    const { productTypeName = '' } = req.body;

    if (!productTypeName) {
      return res.status(400).json({
        error: 'Missing required field',
      });
    }

    const existingProductType = await ProductType.findOne({
      _id: { $ne: productTypeId },
      productTypeName,
    });

    if (existingProductType) {
      return res.status(409).json({
        error: 'This product type is already exist',
      });
    }

    const updatedProductType = await ProductType.findByIdAndUpdate(
      productTypeId,
      {
        productTypeName,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedProductType) {
      return res.status(404).json({
        error: 'Update failed! Product type not found',
      });
    }

    res.status(200).json({
      data: updatedProductType,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const deleteType = async (req, res) => {
  try {
    const { id: productTypeId } = req.params;

    if (!productTypeId || !isValidObjectId(productTypeId)) {
      return res.status(400).json({
        error: 'Invalid Id',
      });
    }

    const deletedType = await ProductType.findByIdAndDelete(productTypeId);

    if (!deletedType) {
      return res.status(404).json({
        error: 'Product type not found',
      });
    }

    res.status(200).json({
      message: 'Product type deleted successfully',
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};
