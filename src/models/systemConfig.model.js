import mongoose from 'mongoose';

const priceFilterSchema = new mongoose.Schema({
  fromPrice: {
    type: Number,
    required: true,
  },
  toPrice: {
    type: Number,
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
    bannerImgPath: [
      {
        type: String,
        required: true,
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
export const SystemConfig = mongoose.model('SystemConfig', systemConfigSchema);
