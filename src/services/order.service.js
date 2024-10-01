import { Cart, CartDetail } from '../models/cart.model.js';
import { Order } from '../models/order.model.js';
import { Voucher } from '../models/voucher.model.js';

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

  if (!existingVoucher) {
    return res.status(404).json({
      error: 'Not found voucher',
    });
  }

  if (existingVoucher.expiredDate < new Date()) {
    return res.status(400).json({
      error: 'Voucher expired!',
    });
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
  ]);

  const totalPrice = populatedOrder.orderDetail.reduce(
    (acc, orderDetail) =>
      acc +
      orderDetail.itemPrice *
        ((100 - orderDetail.product.discount.discountPercent) / 100) *
        orderDetail.quantity,
    0
  );

  let discountedPrice =
    totalPrice - (totalPrice * existingVoucher.discountPercent) / 100;

  if (discountedPrice > existingVoucher.maxPriceDiscount) {
    discountedPrice = existingVoucher.maxPriceDiscount;
  }

  newOrder.totalPrice = discountedPrice + newOrder.shippingFee;

  await newOrder.save();

  populatedOrder.totalPrice = newOrder.totalPrice;

  return {
    status: 201,
    data: populatedOrder,
    error: false,
  };
};
