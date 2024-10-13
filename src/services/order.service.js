import { Cart, CartDetail } from '../models/cart.model.js';
import { Order } from '../models/order.model.js';
import { Product } from '../models/product.model.js';
import { UserVoucher, Voucher } from '../models/voucher.model.js';

export const createOrderService = async ({
  userId,
  orderDetail,
  shippingAddress,
  shippingMethod,
  shippingFee,
  paymentMethod,
  voucherId,
}) => {
  const cart = await Cart.findOne({ userId }).populate('cartItems');

  if (!cart) {
    return {
      status: 404,
      error: 'Cart Not Found',
      data: null,
    };
  }

  const existingVoucher = await Voucher.findById(voucherId);

  if (voucherId) {
    if (!existingVoucher) {
      return {
        error: 'Not found voucher',
        status: 400,
        data: null,
      };
    }

    if (existingVoucher.expiredDate < new Date()) {
      return {
        error: 'Voucher expired!',
        status: 400,
        data: null,
      };
    }
  }

  const existingCartDetail = await CartDetail.find({
    _id: { $in: orderDetail },
  });

  if (Array.isArray(existingCartDetail) && existingCartDetail.length === 0) {
    return {
      status: 400,
      error: 'Some product is not in your cart!',
      data: null,
    };
  }

  const products = await Product.find({
    _id: { $in: existingCartDetail.map((item) => item.product._id) },
  });

  if (Array.isArray(products) && products.length !== 0) {
    for (const product of products) {
      const cartItem = existingCartDetail.find(
        (item) => item.product._id.toString() === product._id.toString()
      );

      if (product.countInStock < cartItem.quantity) {
        return {
          status: 400,
          error: 'Some products were out of stock or insufficient stock',
        };
      } else {
        product.countInStock -= cartItem.quantity;
        await product.save();
      }
    }
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
    voucher: voucherId,
  });

  await cart.save();
  await newOrder.save();

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
        select: 'productName discount',
        populate: {
          path: 'discount',
          select: 'discountPercent discountExpiredDate',
        },
      },
      select: 'quantity itemPrice',
    },
    { path: 'orderStatus' },
    {
      path: 'voucher',
      model: 'Voucher',
      select: 'voucherCode voucherName discountPercent',
    },
  ]);

  const totalPrice = populatedOrder.orderDetail.reduce(
    (acc, orderDetail) =>
      acc +
      orderDetail.itemPrice *
        ((100 - orderDetail.product.discount.discountPercent) / 100) *
        orderDetail.quantity,
    0
  );

  let discountPrice = existingVoucher
    ? (totalPrice * existingVoucher.discountPercent) / 100
    : 0;

  if (
    existingVoucher &&
    discountPrice > existingVoucher.maxPriceDiscount * 1000
  ) {
    discountPrice = existingVoucher.maxPriceDiscount * 1000;
  }

  newOrder.totalPrice = totalPrice - discountPrice + newOrder.shippingFee;

  await UserVoucher.findOneAndDelete({
    userId,
    voucherId,
  });

  await newOrder.save();

  populatedOrder.totalPrice = newOrder.totalPrice;

  return {
    status: 201,
    data: populatedOrder,
    error: false,
  };
};
