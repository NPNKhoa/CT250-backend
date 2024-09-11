import { OrderStatus } from '../models/order.model.js';
import { isValidObjectId } from '../utils/isValidObjectId.js';
import logError from '../utils/logError.js';

export const getAllOrderStatus = async (req, res) => {
  try {
    const orderStatus = await OrderStatus.find();

    if (!Array.isArray(orderStatus) || orderStatus.length === 0) {
      return res.status(404).json({
        error: 'Not found order status',
      });
    }

    res.status(200).json({
      data: orderStatus,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const getOrderStatusById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !isValidObjectId) {
      return res.status(400).json({
        error: 'Invalid object id',
      });
    }

    const orderStatus = await OrderStatus.findById(id);

    if (!orderStatus) {
      return res.status(404).json({
        error: 'Not found order status with this id',
      });
    }

    res.status(200).json({
      data: orderStatus,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const createOrderStatus = async (req, res) => {
  try {
    const { orderStatus } = req.body;

    if (!orderStatus) {
      return res.status(400).json({
        error: 'Missing required field',
      });
    }

    const existingOrderStatus = await OrderStatus.findOne({ orderStatus });

    if (existingOrderStatus) {
      return res.status(409).json({
        error: 'This order status is already exist',
      });
    }

    const createdOrderStatus = await OrderStatus.create({ orderStatus });

    res.status(201).json({
      data: createdOrderStatus,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !isValidObjectId) {
      return res.status(400).json({
        error: 'Invalid object id',
      });
    }

    const { orderStatus } = req.body;

    if (!orderStatus) {
      return res.status(400).json({
        error: 'order status can not be empty',
      });
    }

    const updatedOrderStatus = await OrderStatus.findByIdAndUpdate(
      id,
      { orderStatus },
      { new: true, runValidators: true }
    );

    if (!updatedOrderStatus) {
      return res.status(404).json({
        error: 'Can not found this order status to update',
      });
    }

    res.status(200).json({
      data: updatedOrderStatus,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const deleteOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !isValidObjectId) {
      return res.status(400).json({
        error: 'Invalid object id',
      });
    }

    const deletedOrderStatus = await OrderStatus.findByIdAndDelete(id);

    if (!deletedOrderStatus) {
      return res.status(404).json({
        error: 'Can not find this order status to delete',
      });
    }

    res.status(200).json({
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};
