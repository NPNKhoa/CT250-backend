import { PaymentMethod } from '../models/order.model.js';
import { isValidObjectId } from '../utils/isValidObjectId.js';
import logError from '../utils/logError.js';

export const getAllPaymentMethod = async (req, res) => {
  try {
    const existingMethods = await PaymentMethod.find();

    if (!Array.isArray(existingMethods) || existingMethods.length === 0) {
      return res.status(404).json({
        error: 'Payment method not found',
      });
    }

    res.status(200).json({
      data: existingMethods,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const getPaymentMethodById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({
        error: 'Invalid id',
      });
    }

    const existingMethod = await PaymentMethod.findById(id);

    if (!existingMethod) {
      return res.status(404).json({
        error: 'Not found',
      });
    }

    res.status(200).json({
      data: existingMethod,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const createPaymentMethod = async (req, res) => {
  try {
    const { paymentMethodName } = req.body;

    if (!paymentMethodName) {
      return res.status(400).json({
        error: 'Missing required field',
      });
    }

    const existingMethod = await PaymentMethod.findOne({ paymentMethodName });
    if (existingMethod) {
      return res.status(409).json({
        error: 'Payment method already exists',
      });
    }

    const createdMethod = await PaymentMethod.create({ paymentMethodName });

    res.status(201).json({
      data: createdMethod,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const updatePaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({
        error: 'Invalid id',
      });
    }

    const { paymentMethodName } = req.body;

    if (!paymentMethodName) {
      return res.status(400).json({ error: 'Name can not be empty' });
    }

    const updatedPaymentMethod = await PaymentMethod.findByIdAndUpdate(
      id,
      {
        paymentMethodName,
      },
      { new: true, runValidators: true }
    );

    if (!updatedPaymentMethod) {
      return res.status(404).json({
        error: 'Can not find this payment method to update',
      });
    }

    res.status(200).json({
      data: updatedPaymentMethod,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const deletePaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({
        error: 'Invalid id',
      });
    }

    const deletedPaymentMethod = await PaymentMethod.findByIdAndDelete(id);

    if (!deletedPaymentMethod) {
      return res.status(404).json({
        error: 'Can not find this payment method to delete',
      });
    }

    res.status(200).json({
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};
