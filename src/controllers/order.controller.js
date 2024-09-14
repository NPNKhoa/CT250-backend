import logError from '../utils/logError.js';
import { isValidObjectId } from '../utils/isValidObjectId.js';

import { Order } from '../models/order.model.js';
import { Cart } from '../models/cart.model.js';

export const createOrder = async (req, res) => {
  try {
    const { userId } = req.userId;

    if (!userId) {
      return res.status(401).json({
        error: 'Invalid credentials',
      });
    }

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        error: 'Invalid user id',
      });
    }

    const existingCart = await Cart.findOne({ userId }).populate('cartItems');

    if (!existingCart) {
      return res.status(404).json({
        error: 'Not found cart for this user',
      });
    }

    if (existingCart.cartItems?.length === 0) {
      return res.status(404).json({
        error: 'This cart has no items yet',
      });
    }

    const { shippingAddress, shippingMethod, shippingFee, paymentMethod } =
      req.body;

    if (!shippingAddress || !shippingMethod || !shippingFee || !paymentMethod) {
      return res.status(400).json({
        error: 'Missing required fields',
      });
    }

    const newOrder = new Order({
      user: userId,
      shippingAddress,
      shippingMethod,
      shippingFee,
      paymentMethod,
      orderStatus,
      orderDetail: [],
    });

    let totalPrice = 0;

    existingCart.cartItems.forEach((item) => {
      if (item.isSelected) {
        newOrder.orderDetail.push(item._id);

        totalPrice += item.itemPrice * item.quantity;
      }
    });

    if (newOrder.orderDetail.length === 0) {
      return res.status(400).json({ error: 'No items selected for the order' });
    }

    newOrder.totalPrice = totalPrice;

    const savedOrder = await newOrder.save();

    const populatedOrder = await Order.findById(savedOrder._id)
      .populate('user', 'fullname')
      .populate('shippingAddress', '-isDefault -phone')
      .populate('shippingMethod')
      .populate('paymentMethod')
      .populate('orderDetail', 'product quantity itemPrice')
      .populate('orderStatus');

    res.status(201).json({
      data: populatedOrder,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};
