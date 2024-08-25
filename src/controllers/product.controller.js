import { Product } from '../models/product.model.js';
import { isValidObjectId } from '../utils/isValidObjectId.js';
import logError from '../utils/logError.js';
import { productValidation } from '../utils/validation.js';

export const getAllProducts = async (req, res) => {
  try {
    const { productName = '', page = 1, limit = 10 } = req.query;

    const query = {};

    if (productName) {
      query.productName = { $regex: productName, $options: 'i' };
    }

    const products = await Product.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('productType', 'productTypeName -_id')
      .populate('productBrand', 'brandName brandDesc -_id')
      .populate(
        'technicalSpecification.specificationName',
        'specificationName -_id'
      )
      .populate('promotion', 'promotionName promotionExpiredDate -_id')
      .populate('discount', 'discountPercent discountExpiredDate -_id');

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(404).json({
        error: 'Products not found',
      });
    }

    const totalDocs = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalDocs / limit);

    res.status(200).json({
      data: products,
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

export const getProductById = async (req, res) => {
  try {
    const { id: productId } = req.params;

    if (!productId || !isValidObjectId(productId)) {
      return res.status(400).json({
        error: 'Invalid Id',
      });
    }

    const product = await Product.findById(productId)
      .populate('productType', 'productTypeName -_id')
      .populate('productBrand', 'brandName brandDesc -_id')
      .populate(
        'technicalSpecification.specificationName',
        'specificationName -_id'
      )
      .populate('promotion', 'promotionName promotionExpiredDate -_id')
      .populate('discount', 'discountPercent discountExpiredDate -_id');

    if (!product) {
      return res.status(404).json({
        error: 'Product not found',
      });
    }

    res.status(200).json({
      data: product,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const addProduct = async (req, res) => {
  try {
    const { status, payload } = await productValidation(req.body);

    if (status !== 200) {
      return res.status(status).json({
        error: payload,
      });
    }

    const productImagePath = req?.files?.map((file) => file.path);

    console.log(productImagePath);

    const productInfo = {
      ...payload,
      productImagePath: productImagePath ? productImagePath : [],
    };

    console.log(productInfo);

    const newProduct = await Product.create(productInfo);

    res.status(201).json({
      data: newProduct,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id: productId } = req.params;

    if (!productId || !isValidObjectId(productId)) {
      return res.status(400).json({
        error: 'Invalid Id',
      });
    }

    const existingProduct = await Product.findById(productId);

    const { status, payload } = await productValidation(req.body);

    if (status !== 200) {
      return res.status(status).json({
        error: payload,
      });
    }

    const updateFields = {};

    updateFields.productName =
      payload.productName || existingProduct.productName;
    updateFields.productBrand =
      payload.productBrand || existingProduct.productBrand;
    updateFields.productType =
      payload.productType || existingProduct.productType;
    updateFields.discount = payload.discount || existingProduct.discount;
    updateFields.promotion = payload.promotion || existingProduct.promotion;
    updateFields.technicalSpecification =
      payload.technicalSpecification || existingProduct.technicalSpecification;
    updateFields.price = payload.price || existingProduct.price;
    updateFields.description =
      payload.description || existingProduct.description;

    updateFields.countInStock =
      payload.countInStock > 0
        ? existingProduct.countInStock + payload.countInStock
        : existingProduct.countInStock;

    updateFields.discountedPrice =
      payload.discountedPrice || existingProduct.discountedPrice;

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { $set: updateFields },
      { new: true, runValidators: true }
    )
      .populate('productBrand')
      .populate('productType')
      .populate('discount')
      .populate('promotion')
      .populate('technicalSpecification.specificationName');

    if (!updatedProduct) {
      return res.status(404).json({
        error: 'Product not found',
      });
    }

    res.status(200).json({
      data: updatedProduct,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id: productId } = req.params;

    if (!productId || !isValidObjectId(productId)) {
      return res.status(400).json({
        error: 'Invalid Id',
      });
    }

    const deletedProduct = await Product.findByIdAndDelete(productId);

    if (!deletedProduct) {
      return res.status(404).json({
        error: 'Product not found',
      });
    }

    res.status(200).json({
      message: 'Deleted product successfully',
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};
