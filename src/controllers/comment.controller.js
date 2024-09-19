import { Order } from '../models/order.model.js';
import { isValidObjectId } from '../utils/isValidObjectId.js';
import logError from '../utils/logError.js';

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

    const existingOrder = await Order.find().populate({
      path: 'orderDetail',
      match: { product: productId },
    });

    console.log(existingOrder);

    const reviewImagePath = req?.files?.map((file) => file.path);
  } catch (error) {
    logError(error, res);
  }
};
