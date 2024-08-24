import mongoose from 'mongoose';

const BrandSchema = new mongoose.Schema(
  {
    brandName: {
      type: String,
      required: true,
      unique: true,
    },
    brandDesc: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const ProductTypeSchema = new mongoose.Schema(
  {
    productTypeName: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const PromotionSchema = new mongoose.Schema(
  {
    promotionName: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const DiscountSchema = new mongoose.Schema(
  {
    discountPercent: {
      type: Number,
      required: true,
    },
    discountExpiredDate: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const SpecificationSchema = new mongoose.Schema(
  {
    specificationName: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const ProductSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: true,
    },
    productImagePath: [
      {
        type: String,
      },
    ],
    productBrand: {
      type: mongoose.Types.ObjectId,
      ref: 'Brand',
      required: true,
    },
    productType: {
      type: mongoose.Types.ObjectId,
      ref: 'ProductType',
      required: true,
    },
    discount: {
      type: mongoose.Types.ObjectId,
      ref: 'Discount',
    },
    promotion: {
      type: mongoose.Types.ObjectId,
      ref: 'Promotion',
    },
    technicalSpecification: [
      {
        specificationName: {
          type: mongoose.Types.ObjectId,
          ref: 'Specification',
          required: true,
        },
        specificationDesc: {
          type: String,
          required: true,
        },
      },
    ],
    countInStock: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    avgStar: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Brand = mongoose.model('Brand', BrandSchema);
const ProductType = mongoose.model('ProductType', ProductTypeSchema);
const Promotion = mongoose.model('Promotion', PromotionSchema);
const Discount = mongoose.model('Discount', DiscountSchema);
const Specification = mongoose.model('Specification', SpecificationSchema);
const Product = mongoose.model('Product', ProductSchema);

export { Brand, ProductType, Promotion, Discount, Specification, Product };
