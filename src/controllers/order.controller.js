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

    const { orderDetail, shippingAddress, shippingMethod, shippingFee, paymentMethod, totalPrice } =
      req.body;

    const cart = await Cart.findOne({ userId }).populate('cartItems');

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    const updatedCartItems = cart.cartItems.filter(
      (item) => !orderDetail.includes(item._id.toString())
    );

    cart.cartItems = updatedCartItems;
    await cart.save();

    // // Remove corresponding cartDetail entries
    // await CartDetail.deleteMany({
    //   userId,
    //   product: { $in: orderDetailProductIds }
    // });


    if (!shippingAddress || !shippingMethod || !shippingFee || !paymentMethod) {
      return res.status(400).json({
        error: 'Missing required fields',
      });
    }

    const newOrder = new Order({
      user: userId,
      shippingAddress: shippingAddress,
      shippingMethod: shippingMethod,
      shippingFee: shippingFee,
      paymentMethod: paymentMethod,
      orderDetail: orderDetail,
      totalPrice: totalPrice,
    });
    await newOrder.save();

    const populatedOrder = await Order.findById(newOrder._id)
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
}

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
          select: 'productName productImagePath'
        }
      })
      .populate({
        path: 'orderStatus',
        select: 'orderStatus'
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
}