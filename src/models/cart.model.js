import mongoose from 'mongoose';

const cartDetailSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
    },
    itemPrice: {
      type: Number,
      default: 0,
    },
    isSelected: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    cartItems: [
      {
        type: mongoose.Types.ObjectId,
        ref: 'CartDetail',
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Cart = mongoose.model('Cart', cartSchema);
const CartDetail = mongoose.model('CartDetail', cartDetailSchema);

export { Cart, CartDetail };
