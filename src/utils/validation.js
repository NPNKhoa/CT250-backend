import {
  Brand,
  Discount,
  ProductType,
  Promotion,
  Specification,
} from '../models/product.model.js';
import { isValidObjectId } from '../utils/isValidObjectId.js';

export const validateEmail = (email) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};

export const validatePhone = (phone) => {
  return String(phone).match(
    /^(0?)(3[2-9]|5[6|8|9]|7[0|6-9]|8[0-6|8|9]|9[0-4|6-9])[0-9]{7}$/
  );
};

export const productValidation = async (productInfo) => {
  const {
    productName,
    productBrand,
    productType,
    discount,
    promotion,
    technicalSpecification,
    countInStock,
    price,
    description,
    avgStar = 0,
  } = productInfo;

  if (
    !productName ||
    !productBrand ||
    !productType ||
    !countInStock ||
    !price ||
    !description
  ) {
    return {
      status: 400,
      payload: 'Missing required fields',
    };
  }

  if (
    !isValidObjectId(productBrand) ||
    !isValidObjectId(productType) ||
    (discount && !isValidObjectId(discount)) ||
    (promotion && !isValidObjectId(promotion))
  ) {
    return {
      status: 400,
      payload: 'Invalid Id',
    };
  }

  if (parseInt(price) <= 0) {
    return {
      status: 400,
      payload: 'Price must be a positive number',
    };
  }

  const existingBrand = await Brand.findById(productBrand);
  if (!existingBrand) {
    return {
      status: 404,
      payload: 'Brand not found',
    };
  }

  const existingType = await ProductType.findById(productType);
  if (!existingType) {
    return {
      status: 404,
      payload: 'Product type not found!',
    };
  }

  const existingDiscount = discount ? await Discount.findById(discount) : true;
  if (!existingDiscount) {
    return {
      status: 404,
      payload: 'Discount not found!',
    };
  }

  const existingPromotion = promotion
    ? await Promotion.findById(promotion)
    : true;
  if (!existingPromotion) {
    return {
      status: 404,
      payload: 'Promotion not found!',
    };
  }

  const technicalSpecs = [];
  if (technicalSpecification || Array.isArray(technicalSpecification)) {
    for (const specification of technicalSpecification) {
      const { specificationName, specificationDesc } = specification;

      const existingSpecificationName = await Specification.findById(
        specificationName
      );

      if (!existingSpecificationName) {
        return {
          status: 404,
          payload: 'Specification name not found!',
        };
      }

      technicalSpecs.push({
        specificationName,
        specificationDesc,
      });
    }
  }

  const expiredDate = new Date(existingDiscount.discountExpiredDate).getTime();

  const now = Date.now();

  let newPrice = price;
  if (expiredDate >= now) {
    newPrice = price - price * (existingDiscount.discountPercent / 100);
  }

  const returnedPayload = {
    productName,
    productBrand,
    productType,
    discount,
    discountedPrice: newPrice,
    promotion,
    technicalSpecification: technicalSpecs,
    countInStock,
    price,
    description,
    avgStar,
  };

  return {
    status: 200,
    payload: returnedPayload,
  };
};

export const validRoles = ['customer', 'admin', 'staff'];

export const validGenders = ['male', 'female'];
