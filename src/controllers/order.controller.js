import logError from '../utils/logError.js';
import { isValidObjectId } from '../utils/isValidObjectId.js';

import { Order } from '../models/order.model.js';
import { Cart, CartDetail } from '../models/cart.model.js';
import { User, UserRole } from '../models/user.model.js';
import { validatePhone } from '../utils/validation.js';

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

    const existingCartDetail = await CartDetail.findById(orderDetail);

    if (!existingCartDetail) {
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
      {
        path: 'orderDetail',
        populate: {
          path: 'product',
          model: 'Product',
          select: 'productName',
        },
        select: 'quantity itemPrice',
      },
      { path: 'orderStatus' },
    ]);

    const totalPrice = populatedOrder.orderDetail.reduce(
      (acc, orderDetail) => acc + orderDetail.itemPrice * orderDetail.quantity,
      0
    );

    populatedOrder.totalPrice = totalPrice;
    newOrder.totalPrice = totalPrice;

    await newOrder.save();

    res.status(201).json({
      data: populatedOrder,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      orderStatus, // orderStatus is an objectid.
      startDate,
      endDate,
      userRole, // enum: ['staff', 'customer']
    } = req.query;

    const query = {};

    if (orderStatus && isValidObjectId(orderStatus)) {
      query.orderStatus = orderStatus;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    if (userRole) {
      if (userRole.toString().toLowerCase() === 'admin') {
        return res.status(400).json({
          error: 'Only accept customer and staff for filter condition',
        });
      }

      const role = await UserRole.findOne({ role: userRole.toLowerCase() });

      if (!role) {
        return res.status(400).json({
          error: 'Invalid role',
        });
      }

      const usersWithRole = await User.find({ role: role._id }).select('_id');

      query.user = { $in: usersWithRole.map((user) => user._id) };
    }

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    const orders = await Order.find(query)
      .populate('user', 'fullname')
      .populate('shippingAddress', '-isDefault -phone')
      .populate('shippingMethod')
      .populate('paymentMethod')
      .populate('orderDetail', 'product quantity itemPrice')
      .populate('orderStatus')
      .skip((pageNumber - 1) * limitNumber)
      .limit(parseInt(limitNumber));

    // build a query string and enable filter functionality for order status

    const totalDocs = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalDocs / limitNumber);

    res.status(200).json({
      data: orders,
      meta: {
        totalDocs,
        totalPages,
        currentPage: page,
        limit,
      },
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const getOrderByUser = async (req, res) => {
  try {
    const { userId } = req.userId;
    const { page = 1, limit = 5 } = req.query;

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);

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
      })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber);

    if (!order) {
      return res.status(404).json({
        error: 'Order not found',
      });
    }

    const totalDocs = await Order.countDocuments({ user: userId });
    const totalPages = Math.ceil(totalDocs / limitNumber);

    res.status(200).json({
      data: order,
      meta: {
        totalDocs,
        totalPages,
        currentPage: pageNumber,
        limit: limitNumber,
      },
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { id: orderId } = req.params;

    if (!isValidObjectId(orderId)) {
      return res.status(400).json({
        error: 'Invalid Id format',
      });
    }

    const existingOrder = await Order.findById(orderId)
      .populate({
        path: 'shippingAddress',
        match: { phone },
      })
      .populate('user', 'fullname')
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

    if (!existingOrder) {
      return res.status(404).json({
        error: 'Order not found',
      });
    }

    res.status(200).json({
      data: existingOrder,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const getOrderByPhoneNumber = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!validatePhone(phone)) {
      return res.status(400).json({
        error: 'Invalid phone number format',
      });
    }

    const existingOrders = await Order.find()
      .populate({
        path: 'shippingAddress',
        match: { phone },
      })
      .populate('user', 'fullname')
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

    const filteredOrders = existingOrders.filter(
      (order) => order.shippingAddress !== null
    );

    if (filteredOrders.length === 0) {
      return res.status(404).json({
        error: 'Not found orders with this phone',
      });
    }

    res.status(200).json({
      data: filteredOrders,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};
