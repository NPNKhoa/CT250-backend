import { Order } from '../models/order.model.js';
import Comment from '../models/comment.model.js';
import { Product } from '../models/product.model.js';
import { isValidObjectId } from '../utils/isValidObjectId.js';
import logError from '../utils/logError.js';
import { populate } from 'dotenv';

export const createComment = async (req, res) => {
  try {
    const { userId } = req.userId;

    if (!userId || !isValidObjectId(userId)) {
      return res.status(401).json({
        error: 'Invalid credentials',
      });
    }

    const { productId, content, star } = req.body;

    if (!productId || !content || !star) {
      return res.status(400).json({
        error: 'Missing required fields',
      });
    }

    if (!isValidObjectId(productId)) {
      return res.status(400).json({
        error: 'Invalid product id format',
      });
    }

    if (isNaN(star) || star < 0 || star > 5) {
      return res.status(400).json({
        error: 'Star must be a number between 0 and 5',
      });
    }

    const existingOrders = await Order.find({
      user: userId,
    }).populate({
      path: 'orderDetail',
      match: { product: productId },
    });

    const hasPurchasedProduct = existingOrders.some((order) =>
      order.orderDetail.some((item) => item.product.toString() === productId)
    );

    if (!hasPurchasedProduct) {
      return res.status(404).json({
        error: 'This user have not purchased this product yet!',
      });
    }

    // Tạo bình luận mới
    const newComment = await Comment.create({
      user: userId,
      product: productId,
      content,
      star,
    });

    // Tính toán và cập nhật giá trị trung bình đánh giá cho sản phẩm
    const comments = await Comment.find({ product: productId });
    const totalStars = comments.reduce((sum, comment) => sum + comment.star, 0);
    const avgStar = totalStars / comments.length;

    // Cập nhật sản phẩm với giá trị trung bình mới
    await Product.findByIdAndUpdate(productId, { avgStar });

    res.status(201).json({
      data: newComment,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const getAllProductComment = async (req, res) => {
  try {
    const { productId } = req.query;

    if (!productId || !isValidObjectId(productId)) {
      return res.status(400).json({
        error: 'Invalid id',
      });
    }

    const comments = await Comment.find({ product: productId })
      .select('-product')
      .populate({
        path: 'user',
        model: 'User',
        select: 'fullname avatarImagePath',
      });

    if (Array.isArray(comments) && comments.length === 0) {
      return res.status(404).json({
        error: 'This product has not comments yet',
      });
    }

    res.status(200).json({
      data: comments,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};
