import { Cart, CartDetail } from '../models/cart.model.js';
import { Product } from '../models/product.model.js';
import { getTotalItems, getTotalPrice } from '../utils/getCartExtraInfo.js';
import { isValidObjectId } from '../utils/isValidObjectId.js';
import logError from '../utils/logError.js';

export const getCartByUser = async (req, res) => {
  try {
    const { userId } = req.userId;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        error: 'Invalid Id',
      });
    }

    const cart = await Cart.findOne({ userId })
      .populate({
        path: 'cartItems',
        populate: {
          path: 'product',
          model: 'Product',
          select: 'productName discount productImagePath',
          populate: {
            path: 'discount',
            select: 'discountPercent discountExpiredDate',
          },
        },
        select: 'quantity itemPrice',
      })
      .populate('userId', 'fullname -_id');

    if (!cart) {
      return res.status(404).json({
        error: 'Cart Not Found!',
      });
    }

    const responseData = {
      cart,
      totalPrice: getTotalPrice(cart.cartItems),
      totalCartItems: getTotalItems(cart.cartItems),
    };

    res.status(200).json({
      data: responseData,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const addToCart = async (req, res) => {
  try {
    const { userId } = req.userId;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        error: 'Invalid user id',
      });
    }

    const { productId, quantity } = req.body;

    if (!productId || !quantity) {
      return res.status(400).json({
        error: 'Missing required fields',
      });
    }

    if (!isValidObjectId(productId)) {
      return res.status(400).json({
        error: 'Invalid product id',
      });
    }

    const existingProduct = await Product.findById(productId).populate(
      'discountedPrice',
      '-_id'
    );

    if (!existingProduct) {
      return res.status(404).json({
        error: 'Product not found',
      });
    }

    if (parseInt(quantity) <= 0) {
      return res.status(400).json({
        error: 'Quantity must be greater than 0',
      });
    }

    let cart = await Cart.findOne({ userId }).populate('cartItems');

    if (!cart) {
      cart = new Cart({ userId, cartItems: [] });
    }

    const productIndex = cart.cartItems.findIndex((item) =>
      item.product.equals(productId)
    );

    if (productIndex === -1) {
      const newCartItems = new CartDetail();

      newCartItems.product = productId;
      newCartItems.quantity = parseInt(quantity);
      newCartItems.itemPrice = existingProduct.price;

      await newCartItems.save();
      cart.cartItems.push(newCartItems);
    } else {
      const existingCartItem = cart.cartItems[productIndex];

      existingCartItem.quantity += +quantity;
      existingCartItem.itemPrice += existingProduct.discountedPrice * +quantity;

      await existingCartItem.save();
    }

    const responseData = {
      cart,
      totalPrice: getTotalPrice(cart.cartItems),
      totalCartItems: getTotalItems(cart.cartItems),
    };

    // console.log(responseData);

    await cart.save();

    res.status(201).json({
      data: responseData,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const deleteFromCart = async (req, res) => {
  try {
    const { userId } = req.userId;

    if (!userId) {
      return res.status(401).json({
        error: 'Invalid credentials',
      });
    }

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        error: 'Invalid Id format',
      });
    }

    const { id: productId } = req.params;

    if (!productId || !isValidObjectId(productId)) {
      return res.status(400).json({
        error: 'Invalid Id',
      });
    }

    const cartUser = await Cart.findOne({ userId });

    if (!cartUser) {
      return res.status(404).json({
        error: 'Cart does not exist',
      });
    }

    const deletedItemIndex = cartUser.cartItems.findIndex((item) =>
      item.equals(productId)
    );

    if (deletedItemIndex === -1) {
      return res.status(404).json({
        error: 'Not found this product in your cart',
      });
    }

    await CartDetail.findByIdAndDelete(productId);

    cartUser.cartItems.splice(deletedItemIndex, 1);

    await cartUser.save();

    const updatedCart = {
      cartUser,
      totalPrice: getTotalPrice(cartUser.cartItems),
      totalItems: getTotalItems(cartUser.cartItems),
    };

    res.status(200).json({
      data: updatedCart,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const deleteAllFromCart = async (req, res) => {
  try {
    const { userId } = req.userId;

    if (!userId) {
      return res.status(401).json({
        error: 'Invalid credentials',
      });
    }

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        error: 'Invalid id format',
      });
    }

    const existingCart = await Cart.findOne({ userId });

    if (!existingCart) {
      return res.status(404).json({
        error: 'This user has not created a cart yet',
      });
    }

    // Delete all cart detail
    await CartDetail.deleteMany({ _id: { $in: existingCart.cartItems } });

    // Delete all cartItems in cart
    await Cart.findByIdAndDelete(existingCart._id);

    return res.status(200).json({
      message: 'Cart deleted successfully',
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const changeItemQuantity = async (req, res) => {
  try {
    const { userId } = req.userId;

    if (!userId) {
      return res.status(401).json({
        error: 'Invalid credentials',
      });
    }

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        error: 'Invalid Id format',
      });
    }

    const existingCart = await Cart.findOne({ userId });

    if (!existingCart) {
      return res.status(404).json({
        error: 'No cart to update',
      });
    }

    const { productId, quantity } = req.body;

    const updatedItemIndex = existingCart.cartItems.findIndex((item) =>
      item.equals(productId)
    );

    if (updatedItemIndex === -1) {
      return res.status(400).json({
        error: 'Not found this product in your cart',
      });
    }

    if (quantity === 0) {
      existingCart.cartItems.splice(updatedItemIndex, 1);

      await CartDetail.findByIdAndDelete(productId);
    } else {
      existingCart.cartItems[updatedItemIndex].quantity = quantity;

      await CartDetail.findByIdAndUpdate(
        productId,
        {
          quantity,
        },
        { new: true, runValidators: true }
      );
    }

    await existingCart.save();

    const responseData = {
      existingCart,
      totalPrice: getTotalPrice(existingCart.cartItems),
      totalItems: getTotalItems(existingCart.cartItems),
    };

    res.status(200).json({
      data: responseData,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const selectItem = async (req, res) => {
  try {
    const { userId } = req.userId;

    if (!userId) {
      return res.status(401).json({
        error: 'Invalid credentials',
      });
    }

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        error: 'Invalid user id format',
      });
    }

    const { productId } = req.body;

    const cart = await Cart.findOne({ userId }).populate('cartItems');

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    const cartItem = cart.cartItems.filter(
      (item) => productId === item.product.toString()
    );

    if (!cartItem) {
      return res.status(404).json({ error: 'Product not found in cart' });
    }

    cartItem.isSelected = true;

    await cart.save();

    res.status(200).json({
      data: cart,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const createCartDetail = async (req, res) => {
  try {
    const { userId } = req.userId;

    if (!userId || !isValidObjectId(userId)) {
      return res.status(400).json({
        error: 'Invalid id',
      });
    }

    const { productId, quantity } = req.body;

    if (!productId || !isValidObjectId(productId)) {
      return res.status(400).json({
        error: 'Invalid id',
      });
    }

    if (Number.isNaN(quantity) && quantity < 1) {
      return res.status(400).json({
        error: 'Quantity must be a number grater than 0',
      });
    }

    const existingProduct = await Product.findById(productId);

    if (!existingProduct) {
      return res.status(404).json({
        error: 'Not found product with this id',
      });
    }

    const cart = await Cart.findOne({ userId });

    const newCartDetail = await CartDetail.create({
      product: productId,
      quantity,
      itemPrice: existingProduct.price * quantity,
    });

    if (!cart) {
      await Cart.create({
        userId,
      });
    }

    res.status(201).json({
      data: newCartDetail,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const getCartDetail = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({
        error: 'Invalid id',
      });
    }

    const cartDetail = await CartDetail.findById(id).populate({
      path: 'product',
      model: 'Product',
      select: 'productName discount productImagePath',
      populate: {
        path: 'discount',
        select: 'discountPercent discountExpiredDate',
      },
    });

    if (!cartDetail) {
      return res.status(404).json({
        error: 'Not found cart detail with this id',
      });
    }

    res.status(200).json({
      data: cartDetail,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};
