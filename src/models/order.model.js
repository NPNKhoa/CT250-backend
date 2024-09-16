import mongoose from 'mongoose';

const paymentMethodSchema = new mongoose.Schema(
  {
    paymentMethodName: {
      type: String,
      required: true,
      unique: true,
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
  },
  {
    shippingMethodDesc: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  orderDate: {
    type: Date,
    required: true,
    default: Date.now(),
  },
  shippingAddress: {
    type: mongoose.Types.ObjectId,
    ref: 'Address',
    required: true,
  },
  shippingMethod: {
    type: mongoose.Types.ObjectId,
    ref: 'ShippingMethod',
    required: true,
  },
  shippingFee: {
    type: Number,
    required: true,
    default: 0,
  },
  paymentMethod: {
    type: mongoose.Types.ObjectId,
    ref: 'PaymentMethod',
    required: true,
  },
  orderDetail: [
    {
      type: mongoose.Types.ObjectId,
      ref: 'CartDetail',
    },
  ],
  paymentStatus: {
    type: Boolean,
    required: true,
    default: false,
  },
  orderStatus: {
    type: mongoose.Types.ObjectId,
    ref: 'OrderStatus',
    default: '66e0bf5b97d3d40c4f0fb70a',
  },
  deliveredDate: {
    type: Date,
  },
  paidDate: {
    type: Date,
  },
  totalPrice: {
    type: Number,
    default: 0,
  },
});

const PaymentMethod = mongoose.model('PaymentMethod', paymentMethodSchema);
const OrderStatus = mongoose.model('OrderStatus', orderStatusSchema);
const ShippingMethod = mongoose.model('ShippingMethod', shippingMethodSchema);
const Order = mongoose.model('Order', orderSchema);

export { PaymentMethod, OrderStatus, ShippingMethod, Order };
