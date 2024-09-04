import mongoose from 'mongoose';

const paymentMethodSchema = new mongoose.Schema(
  {
    paymentMethodName: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const orderStatusSchema = new mongoose.Schema(
  {
    orderStatus: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const shippingMethodSchema = new mongoose.Schema(
  {
    shippingMethod: {
      type: String,
      required: true,
    },
    shippingFee: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);
