import { Product } from '../models/product.model.js';
import { isValidObjectId } from '../utils/isValidObjectId.js';
import logError from '../utils/logError.js';
import { productValidation } from '../utils/validation.js';
import mongoose from 'mongoose';

export const getAllProducts = async (req, res) => {
  try {
    const {
      searchString = '',
      category = '',
      minPrice = null,
      maxPrice = null,
      page = 1,
      limit = 10,
      isDesc = false,
      sortBy = '',
    } = req.query;

    const query = {};

    if (searchString) {
      const allProductTypes = await mongoose.connection.db
        .collection('producttypes')
        .find({})
        .toArray();
      const allBrands = await mongoose.connection.db
        .collection('brands')
        .find({})
        .toArray();

      const words = searchString.trim().split(' ');

      const matchedProductTypes = [];
      const matchedBrands = [];
      const remainingWords = [];

      words.forEach((word) => {
        const lowerCaseWord = word.toLowerCase();

        const matchedProductType = allProductTypes.find((type) =>
          type.productTypeName.toLowerCase().includes(lowerCaseWord)
        );
        if (matchedProductType) {
          matchedProductTypes.push(matchedProductType._id);
          return;
        }

        const matchedBrand = allBrands.find((brand) =>
          brand.brandName.toLowerCase().includes(lowerCaseWord)
        );
        if (matchedBrand) {
          matchedBrands.push(matchedBrand._id);
          return;
        }

        remainingWords.push(word);
      });

      if (remainingWords.length > 0) {
        query.productName = { $regex: remainingWords.join(' '), $options: 'i' };
      }

      if (matchedProductTypes.length > 0) {
        query.productType = { $in: matchedProductTypes };
      }

      if (matchedBrands.length > 0) {
        query.productBrand = { $in: matchedBrands };
      }
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) {
        query.discountedPrice.$gte = parseFloat(minPrice);
      }
      if (maxPrice) {
        query.discountedPrice.$lte = parseFloat(maxPrice);
      }
    }

    const pipeline = [{ $match: query }];

    // if (category && category.trim() !== '') {
      pipeline.push({
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryDetails',
        },
      });
      pipeline.push({ $unwind: '$categoryDetails' });
      pipeline.push({
        $match: {
          'categoryDetails.categoryName': { $regex: category, $options: 'i' },
        },
      });
    // }

    pipeline.push({
      $lookup: {
        from: 'discounts',
        localField: 'discount',
        foreignField: '_id',
        as: 'discountDetails',
      },
    });
    pipeline.push({ $unwind: '$discountDetails' });

    let sortStage = {};

    if (sortBy) {
      const sortDirection = isDesc === 'true' ? -1 : 1;
      sortStage = { $sort: { [sortBy]: sortDirection } };
    } else {
      sortStage = { $sort: { countInStock: -1 } };
    }

    pipeline.push(sortStage);

    const totalDocsPipeline = [...pipeline];
    const totalDocsResult = await mongoose.connection.db
      .collection('products')
      .aggregate(totalDocsPipeline)
      .toArray();

    const totalDocs = totalDocsResult.length;

    if (parseInt(limit) !== -1) {
      pipeline.push(
        { $skip: (page - 1) * parseInt(limit) },
        { $limit: parseInt(limit) }
      );
    }

    const products = await mongoose.connection.db
      .collection('products')
      .aggregate(pipeline)
      .toArray();

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(404).json({ error: 'Products not found' });
    }

    res.status(200).json({
      data: products,
      error: false,
      meta: {
        totalDocs,
        totalPages:
          parseInt(limit) === -1 ? 1 : Math.ceil(totalDocs / parseInt(limit)),
        currentPage: parseInt(page),
        limit: parseInt(limit),
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
      .populate('category')
      .populate(
        'technicalSpecification.specificationName',
        'specificationName -_id'
      )
      .populate({
        path: 'promotion',
        populate: [
          {
            path: 'productIds',
            select: 'productName price',
          },
          {
            path: 'serviceIds',
            select: 'serviceName servicePrice -_id',
          },
        ],
      })
      .populate('discount', 'discountPercent discountExpiredDate -_id')
      .populate({
        path: 'category',
        populate: [
          {
            path: 'productType',
            select: 'productTypeName -_id',
          },
          {
            path: 'brand',
            select: 'brandName -_id',
          },
        ],
      });

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

export const uploadImage = async (req, res) => {
  try {
    const productImagePath = req?.files?.map((file) => file.path);
    res.status(200).json({
      data: productImagePath,
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

    payload.productImagePath =
      payload.productImagePath ||
      (req.files ? req.files.map((file) => file.path) : []);

    const productInfo = {
      ...payload,
    };

    console.log(productInfo);

    const newProduct = await Product.create(productInfo);

    const populatedProduct = await Product.findById(newProduct._id)
      .populate('discount')
      .populate('promotion')
      .populate('technicalSpecification.specificationName')
      .populate({
        path: 'category',
        populate: [
          {
            path: 'productType',
            select: 'productTypeName -_id',
          },
          {
            path: 'brand',
            select: 'brandName -_id',
          },
        ],
      });

    res.status(201).json({
      data: populatedProduct,
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
    updateFields.category =
      payload.category || existingProduct.category;
    updateFields.discount = payload.discount || existingProduct.discount;
    updateFields.promotion = payload.promotion || existingProduct.promotion;
    updateFields.technicalSpecification =
      payload.technicalSpecification || existingProduct.technicalSpecification;
    updateFields.price = payload.price || existingProduct.price;
    updateFields.description =
      payload.description || existingProduct.description;
    updateFields.productImagePath =
      payload.productImagePath || existingProduct.productImagePath;

    updateFields.countInStock =
      payload.countInStock > 0
        ? payload.countInStock
        : existingProduct.countInStock;

    updateFields.discountedPrice =
      payload.discountedPrice || existingProduct.discountedPrice;

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { $set: updateFields },
      { new: true, runValidators: true }
    )
      .populate('discount')
      .populate('promotion')
      .populate('technicalSpecification.specificationName')
      .populate({
        path: 'category',
        populate: [
          {
            path: 'productType',
            select: 'productTypeName -_id',
          },
          {
            path: 'brand',
            select: 'brandName -_id',
          },
        ],
      });

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
