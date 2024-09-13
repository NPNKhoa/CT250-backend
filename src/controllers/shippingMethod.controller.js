import { ShippingMethod } from '../models/order.model.js';
import { isValidObjectId } from '../utils/isValidObjectId.js';
import logError from '../utils/logError.js';

export const getAllShippingMethods = async (req, res) => {
  try {
    const shippingMethods = await ShippingMethod.find();

    if (!Array.isArray(shippingMethods) || shippingMethods.length === 0) {
      return res.status(404).json({
        error: 'Not found shipping method',
      });
    }

    res.status(200).json({
      data: shippingMethods,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const getShippingMethodById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({
        error: 'Invalid id',
      });
    }

    const shippingMethod = await ShippingMethod.findById(id);

    if (!shippingMethod) {
      return res.status(404).json({
        error: 'Can not find shipping method for this id',
      });
    }

    res.status(200).json({
      data: shippingMethod,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const createShippingMethod = async (req, res) => {
  try {
    const { shippingMethod, shippingMethodDesc } = req.body;

    if (!shippingMethod) {
      return res.status(400).json({
        error: 'Shipping method can not be empty!',
      });
    }

    const existingMethod = await ShippingMethod.findOne({ shippingMethod });

    if (existingMethod) {
      return res.status(409).json({
        error: 'This method already exist',
      });
    }

    const createdShippingMethod = await ShippingMethod.create({
      shippingMethod,
      shippingMethodDesc,
    });

    res.status(201).json({
      data: createdShippingMethod,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const updateShippingMethod = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({
        error: 'Invalid id',
      });
    }

    const { shippingMethod, shippingMethodDesc } = req.body;

    const existingMethod = await ShippingMethod.findOne({ shippingMethod });

    if (existingMethod) {
      return res.status(409).json({
        error: 'This shipping method is already exist',
      });
    }

    const updatedShippingMethod = await ShippingMethod.findByIdAndUpdate(
      id,
      { shippingMethod, shippingMethodDesc },
      { new: true, runValidators: true }
    );

    if (!updatedShippingMethod) {
      return res.status(404).json({
        error: 'Can not find this shipping method to update',
      });
    }

    res.status(200).json({
      data: updatedShippingMethod,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const deleteShippingMethod = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({
        error: 'Invalid id',
      });
    }

    const deletedShippingMethod = await ShippingMethod.findByIdAndDelete(id);

    if (!deletedShippingMethod) {
      return res.status(404).json({
        error: 'Can not find this shipping method to delete',
      });
    }

    res.status(200).json({
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};
