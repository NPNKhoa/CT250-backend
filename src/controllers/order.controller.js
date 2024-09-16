import logError from '../utils/logError.js';
import { isValidObjectId } from '../utils/isValidObjectId.js';

import { Order } from '../models/order.model.js';
import { Cart } from '../models/cart.model.js';
import isSubArray from '../utils/isSubArray.js';

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

    const cart = await Cart.findOne({ userId }).populate('cartItems');

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    const {
      orderDetail,
      shippingAddress,
      shippingMethod,
      shippingFee,
      paymentMethod,
      totalPrice,
    } = req.body;

    if (!shippingAddress || !shippingMethod || !shippingFee || !paymentMethod) {
      return res.status(400).json({
        error: 'Missing required fields',
      });
    }

    if (!Array.isArray(orderDetail) || orderDetail.length === 0) {
      return res.status(400).json({
        error: 'Can not create order without products',
      });
    }

    if (
      !isSubArray(
        orderDetail,
        cart.cartItems.map((item) => item._id.toString())
      )
    ) {
      return res.status(400).json({
        error: 'Some product is not in your cart!',
      });
    }

    cart.cartItems = cart.cartItems.filter(
      (item) => !orderDetail.includes(item._id.toString())
    );

    const newOrder = new Order({
      user: userId,
      shippingAddress,
      shippingMethod,
      shippingFee,
      paymentMethod,
      orderDetail,
      totalPrice,
    });

    await Promise.all([cart.save(), newOrder.save()]);

    const populatedOrder = await Order.findById(newOrder._id).populate([
      { path: 'user', select: 'fullname -_id' },
      {
        path: 'shippingAddress',
        select: '-isDefault -phone -_id -createdAt -updatedAt',
      },
      { path: 'shippingMethod' },
      { path: 'paymentMethod' },
      { path: 'orderDetail', select: 'product quantity itemPrice' },
      { path: 'orderStatus' },
    ]);

    res.status(201).json({
      data: populatedOrder,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const getAllOrders = async (_, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'fullname')
      .populate('shippingAddress', '-isDefault -phone')
      .populate('shippingMethod')
      .populate('paymentMethod')
      .populate('orderDetail', 'product quantity itemPrice')
      .populate('orderStatus');

    res.status(200).json({
      data: orders,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const getOrderByUser = async (req, res) => {
  try {
    const { userId } = req.userId;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        error: 'Invalid order id',
      });
    }

    const order = await Order.find({ user: userId })
      .populate('user', 'fullname')
      .populate('shippingAddress', '-isDefault -phone')
      .populate('shippingMethod')
      .populate('paymentMethod')
      .populate({
        path: 'orderDetail',
        populate: {
          path: 'product',
          select: 'productName productImagePath',
        },
      })
      .populate({
        path: 'orderStatus',
        select: 'orderStatus',
      });

    if (!order) {
      return res.status(404).json({
        error: 'Order not found',
      });
    }

    res.status(200).json({
      data: order,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};
