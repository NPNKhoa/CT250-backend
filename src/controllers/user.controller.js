import { User, UserRole } from '../models/user.model.js';
import { isValidObjectId } from '../utils/isValidObjectId.js';
import logError from '../utils/logError.js';
import { validateEmail, validatePhone } from '../utils/validation.js';
import bcrypt from 'bcrypt';

export const getLoggedInUser = async (req, res) => {
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

    const existingUser = await User.findById(userId)
      .select('-password -refreshToken')
      .populate('role');

    if (!existingUser) {
      return res.status(404).json({
        error: 'User not found!',
      });
    }

    res.status(200).json({
      data: existingUser,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const {
      fullname = '',
      email = '',
      role = '',
      page = 1,
      limit = 10,
    } = req.query;

    const existingRole = await UserRole.findOne({ role });
    const roleId = existingRole?._id;

    const query = {};

    if (fullname) {
      query.fullname = { $regex: fullname, $options: 'i' };
    }

    if (email) {
      query.email = { $regex: email, $options: 'i' };
    }

    if (role && isValidObjectId(roleId)) {
      query.role = existingRole;
    }

    const existingUsers = await User.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('role');

    if (!Array.isArray(existingUsers) || existingUsers.length === 0) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    const totalDocs = await User.countDocuments(query);
    const totalPages = Math.ceil(totalDocs / limit);

    res.status(200).json({
      data: existingUsers,
      error: false,
      meta: {
        totalDocs,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    logError(error, res);
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id: userId } = req.params;

    if (!userId || !isValidObjectId(userId)) {
      return res.status(400).json({
        error: 'Invalid Id',
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    res.status(200).json({
      data: user,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const updateUserInfo = async (req, res) => {
  try {
    const { userId } = req.userId;

    if (!userId) {
      return res.status(401).json({
        error: 'Invalid credentials',
      });
    }

    const existingUser = await User.findById(userId);

    if (!existingUser) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    const { fullname, email, phone, gender, dateOfBirth } = req.body;

    if (email && !validateEmail(email)) {
      return res.status(400).json({
        error: 'Invalid Email',
      });
    }

    if (phone && !validatePhone(phone)) {
      return res.status(400).json({
        error: 'Invalid phone number',
      });
    }

    const newInfo = {
      fullname: fullname || existingUser.fullname,
      email: email || existingUser.email,
      phone: phone || existingUser.phone,
      gender: gender || existingUser.gender,
      dateOfBirth: dateOfBirth || existingUser.dateOfBirth,
      fullname: fullname || existingUser.fullname,
    };

    const updatedUser = await User.findByIdAndUpdate(userId, newInfo, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      data: updatedUser,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const changeAvatar = async (req, res) => {
  try {
    const { userId } = req.userId;

    if (!userId) {
      return res.status(401).json({
        error: 'Invalid credentials',
      });
    }

    const avatarImagePath = req?.file?.path;

    console.log(avatarImagePath);

    if (!avatarImagePath) {
      return res.status(400).json({
        error: 'Missing file',
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatarImagePath },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        error: 'Not found user',
      });
    }

    res.status(200).json({
      data: updatedUser,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const updatePassword = async (req, res) => {
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

    const existingUser = await User.findById(userId);

    if (!existingUser) {
      return res.status(404).jsoN({
        error: 'User not found',
      });
    }

    const { oldPassword, password, confirmPassword } = req.body;

    if (!oldPassword || !password || !confirmPassword) {
      return res.status(400).json({
        error: 'Missing required fields',
      });
    }

    const isMatch = await bcrypt.compare(oldPassword, existingUser.password);
    if (!isMatch) {
      return res.status(401).json({
        error: 'Wrong password',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        error: 'Passwords do not match',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const newPassword = await bcrypt.hash(password, salt);

    existingUser.password = newPassword;

    await existingUser.save();

    res.status(200).json({
      message: 'Update password successfully',
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};
