import { Address, User } from '../models/user.model.js';
import { isValidObjectId } from '../utils/isValidObjectId.js';
import logError from '../utils/logError.js';

export const getUserAddress = async (req, res) => {
  try {
    const { userId } = req.userId;

    if (!userId || !isValidObjectId(userId)) {
      return res.status(400).json({
        error: 'Invalid Id',
      });
    }

    const existingUser = await User.findById(userId).populate('address');

    if (!existingUser) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    const address = existingUser.address;

    if (!Array.isArray(address) || address.length === 0) {
      return res.status(404).json({
        error: 'Can not found address for this user',
      });
    }

    res.status(200).json({
      data: address,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const getAddressById = async (req, res) => {
  try {
    const { id: addressId } = req.params;

    if (!addressId || !isValidObjectId(addressId)) {
      return res.status(400).json({
        error: 'Invalid Id',
      });
    }

    const address = await Address.findById(addressId);

    res.status(200).json({
      data: address,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const createAddress = async (req, res) => {
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

    const { fullname, phone, province, district, commune, detail, isDefault } =
      req.body;

    const existingUser = await User.findById(userId).populate({
      path: 'address',
      match: {
        fullname: fullname && { $regex: fullname, $options: 'i' },
        phone: phone && { $regex: phone, $options: 'i' },
        province: province && { $regex: province, $options: 'i' },
        district: district && { $regex: district, $options: 'i' },
        commune: commune && { $regex: commune, $options: 'i' },
        detail: detail && { $regex: detail, $options: 'i' },
      },
    });

    if (!existingUser) {
      return res.status(404).json({
        error: 'User does not exist',
      });
    }

    if (existingUser.address && existingUser.address?.length > 0) {
      return res.status(409).json({
        error: 'Address already exist',
      });
    }

    if (!province || !district || !commune) {
      return res.status(400).json({
        error: 'Missing required fields',
      });
    }

    const newAddress = await Address.create({
      fullname: fullname || existingUser.fullname,
      phone: phone || existingUser.phone,
      province,
      district,
      commune,
      detail,
      isDefault,
    });

    existingUser.address.push(newAddress._id);

    await existingUser.save();

    res.status(200).json({
      data: newAddress,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const updateAddress = async (req, res) => {
  try {
    const { id: addressId } = req.params;

    if (!addressId || !isValidObjectId(addressId)) {
      return res.status(400).json({
        error: 'Invalid Id',
      });
    }

    const existingAddress = await Address.findById(addressId);

    if (!existingAddress) {
      return res.status(404).json({
        error: 'Not found address',
      });
    }

    const { fullname, phone, province, district, commune, detail, isDefault } =
      req.body;

    const updatedAddress = await Address.findByIdAndUpdate(
      addressId,
      {
        fullname: fullname || existingAddress.fullname,
        phone: phone || existingAddress.phone,
        province: province || existingAddress.province,
        district: district || existingAddress.district,
        commune: commune || existingAddress.commune,
        detail: detail || existingAddress.detail,
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      data: updatedAddress,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const deleteAddress = async (req, res) => {
  try {
    const { id: addressId } = req.params;
    const { userId } = req.userId;

    console.log(addressId);

    if (!addressId || !isValidObjectId(addressId)) {
      return res.status(400).json({
        error: 'Invalid Id',
      });
    }

    await Address.findByIdAndDelete(addressId);
    await User.updateOne(
      { _id: userId },
      { $pull: { address: addressId } }
    );

    res.status(200).json({
      message: 'Delete address successfully'
    });
  } catch (error) {
    logError(error, res);
  }
};
