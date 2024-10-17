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
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

const categorySchema = new mongoose.Schema({
  categoryName: {
    type: String,
    default: '',
  },
  productType: {
    type: mongoose.Types.ObjectId,
    ref: 'ProductType',
    default: '',
  },
  brand: {
    type: mongoose.Types.ObjectId,
    ref: 'Brand',
    default: '',
  },
});

const PromotionSchema = new mongoose.Schema(
  {
    promotionStartDate: {
      type: Date,
      required: true,
    },
    promotionExpiredDate: {
      type: Date,
      required: true,
    },
    productIds: [
      {
        type: mongoose.Types.ObjectId,
        ref: 'Product',
      },
    ],
    serviceIds: [
      {
        type: mongoose.Types.ObjectId,
        ref: 'Service',
      },
    ],
  },
  {
    timestamps: true,
  }
);

const ServiceSchema = new mongoose.Schema(
  {
    serviceName: {
      type: String,
      required: true,
    },
    servicePrice: {
      type: Number,
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
    discountStartDate: {
      type: Date,
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
      unique: true,
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
    category: {
      type: mongoose.Types.ObjectId,
      ref: 'Category',
      default: '',
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
    discountedPrice: {
      type: Number,
      default: 0,
    },
    description: {
      type: Array,
      required: true,
    },
    avgStar: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Brand = mongoose.model('Brand', BrandSchema);
const ProductType = mongoose.model('ProductType', ProductTypeSchema);
const Category = mongoose.model('Category', categorySchema);
const Promotion = mongoose.model('Promotion', PromotionSchema);
const Discount = mongoose.model('Discount', DiscountSchema);
const Specification = mongoose.model('Specification', SpecificationSchema);
const Product = mongoose.model('Product', ProductSchema);
const Service = mongoose.model('Service', ServiceSchema);

export {
  Brand,
  ProductType,
  Category,
  Promotion,
  Discount,
  Specification,
  Product,
  Service,
};
