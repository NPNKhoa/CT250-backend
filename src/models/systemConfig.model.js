import mongoose from 'mongoose';

const priceFilterSchema = new mongoose.Schema({
  fromPrice: {
    type: Number,
  },
  toPrice: {
    type: Number,
  },
});

const percentFilterSchema = new mongoose.Schema({
  fromValue: {
    type: Number,
  },
  toValue: {
    type: Number,
  },
});

const bannerSchema = new mongoose.Schema({
  bannerImgPath: {
    type: String,
    default: '',
  },
  isActiveBanner: {
    type: Boolean,
    default: false,
  },
});

const founderSchema = new mongoose.Schema({
  founderName: {
    type: String,
    required: true,
    default: '',
  },
  founderAvatarPath: {
    type: String,
    default: '',
  },
});

const coreValueSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    default: '',
  },
  content: {
    type: String,
    required: true,
    default: '',
  },
});

const systemConfigSchema = new mongoose.Schema(
  {
    shopName: {
      type: String,
      required: true,
    },
    shopLogoImgPath: {
      type: String,
      required: true,
    },
    banners: [
      {
        type: mongoose.Types.ObjectId,
        ref: 'Banner',
      },
    ],
    shopEmail: {
      type: String,
      required: true,
    },
    shopPhoneNumber: {
      type: String,
      required: true,
    },
    shopIntroduction: {
      type: String,
      default: '',
    },
    shopPriceFilter: [
      {
        type: mongoose.Types.ObjectId,
        ref: 'PriceFilter',
        default: '',
      },
    ],
    shopPercentFilter: [
      {
        type: mongoose.Types.ObjectId,
        ref: 'PercentFilter',
        default: '',
      },
    ],
    coreValue: [
      {
        type: mongoose.Types.ObjectId,
        ref: 'CoreValue',
        default: '',
      },
    ],
    founders: [
      {
        type: mongoose.Types.ObjectId,
        ref: 'Founder',
        default: '',
      },
    ],
    isChoose: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const PriceFilter = mongoose.model('PriceFilter', priceFilterSchema);
export const PercentFilter = mongoose.model(
  'PercentFilter',
  percentFilterSchema
);
export const Banner = mongoose.model('Banner', bannerSchema);
export const Founder = mongoose.model('Founder', founderSchema);
export const CoreValue = mongoose.model('CoreValue', coreValueSchema);
export const SystemConfig = mongoose.model('SystemConfig', systemConfigSchema);
