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

    // Kiểm tra xem người dùng đã bình luận sản phẩm này chưa
    const existingComment = await Comment.findOne({
      user: userId,
      product: productId,
    });

    if (existingComment) {
      return res
        .status(400)
        .json({ error: 'You can only comment once per product!' });
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

export const getAllComments = async (req, res) => {
  try {
    // Tìm tất cả các bình luận và populate thông tin người dùng và sản phẩm
    const comments = await Comment.find()
      .populate({
        path: 'user',
        model: 'User',
        select: 'fullname', // Lấy tên đầy đủ và hình đại diện của người dùng
      })
      .populate({
        path: 'product',
        select: 'productName productImagePath',
      })
      .populate({
        path: 'replies.user', // Populate cho user trong replies
        model: 'User',
        select: 'fullname', // Lấy tên đầy đủ của người dùng trong replies
      });

    // Định dạng lại dữ liệu trả về
    const formattedComments = comments.map((comment) => ({
      id: comment._id,
      productName: comment.product?.productName || 'Unknown Product',
      productImage: comment.product?.productImagePath || null,
      reviewer: comment.user?.fullname || 'Anonymous',
      rating: comment.star,
      comment: comment.content,
      createdAt: comment.createdAt,
      replies: [
        ...comment.replies.map((reply) => ({
          user: reply.user?.fullname || 'Anonymous',
          content: reply.content,
          createdAt: reply.createdAt,
        })),
      ],
    }));

    // Gửi phản hồi với danh sách các bình luận đã được định dạng
    res.status(200).json({
      data: formattedComments,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const addReply = async (req, res) => {
  const { userId } = req.userId;
  const { reviewId } = req.params;
  const { replyContent } = req.body;

  try {
    // Tìm review theo ID
    const review = await Comment.findById(reviewId);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    // Thêm câu trả lời vào mảng replies của review
    review.replies.push({ user: userId, content: replyContent });
    await review.save();

    res.status(200).json({ message: 'Reply added successfully', review });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error adding reply', error: error.message });
  }
};

export const deleteComment = async (req, res) => {
  const { reviewId } = req.params;

  // Kiểm tra tính hợp lệ của reviewId
  if (!isValidObjectId(reviewId)) {
    return res.status(400).json({ error: 'Invalid comment id' });
  }

  try {
    // Tìm và xóa comment cùng một lúc
    const result = await Comment.findByIdAndDelete(reviewId);

    if (!result) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    return res
      .status(200)
      .json({ success: true, message: 'Comment deleted successfully' });
  } catch (error) {
    logError(error, res);
  }
};
