import { Brand, Category, ProductType } from '../models/product.model.js';
import { isValidObjectId } from '../utils/isValidObjectId.js';
import logError from '../utils/logError.js';

export const getAllCategory = async (_, res) => {
  try {
    const categories = await Category.find()
      .populate('productType')
      .populate('brand');

    if (Array.isArray(categories) && categories.length === 0) {
      return res.status(404).json({
        error: 'Not found',
      });
    }

    res.status(200).json({
      data: categories,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const createCategory = async (req, res) => {
  try {
    const { productType, brand } = req.body; // objectId

    const existingProductType = await ProductType.findById(productType);

    if (!existingProductType) {
      return res.status(400).json({
        error: 'Not found product type',
      });
    }

    const existingBrand = await Brand.findById(brand);

    if (!existingBrand) {
      return res.status(400).json({
        error: 'Not found brand',
      });
    }

    const newCategory = await Category.create({ productType, brand });

    const categoryName = `${existingProductType.productTypeName} ${existingBrand.brandName}`;

    newCategory.categoryName = categoryName;

    await newCategory.save();
    console.log(newCategory);

    res.status(201).json({
      data: newCategory,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (id && !isValidObjectId(id)) {
      return res.status(400).json({
        error: 'Invalid id',
      });
    }

    const deletedCategory = await Category.findByIdAndDelete(id);

    if (!deletedCategory) {
      return res.status(404).json({
        error: 'Not found',
      });
    }

    res.sendStatus(204);
  } catch (error) {
    logError(error, res);
  }
};
