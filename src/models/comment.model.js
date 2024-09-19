import mongoose from 'mongoose';

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
    replyUser: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
    },
    replyContent: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('ProductReview', productReviewSchema);
