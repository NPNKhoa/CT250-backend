import mongoose from 'mongoose';

const replySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const productReviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    product: {
      type: mongoose.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    star: {
      type: Number,
      required: true,
    },
    reviewImagePath: [
      {
        type: String,
        default: '',
      },
    ],
    replies: [replySchema],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('ProductReview', productReviewSchema);
