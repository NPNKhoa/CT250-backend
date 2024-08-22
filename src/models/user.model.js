import mongoose from 'mongoose';
import { validGenders, validRoles } from '../utils/validation.js';

const userRoleSchema = new mongoose.Schema({
  role: {
    type: String,
    required: true,
    enum: validRoles,
    default: 'customer',
  },
});

const userSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      minLength: 8,
    },
    phone: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      required: true,
      enum: validGenders,
    },
    dateOfBirth: {
      type: Date,
    },
    avatarImagePath: {
      type: String,
      default: '',
    },
    role: {
      type: mongoose.Types.ObjectId,
      ref: 'UserRole',
    },
    address: {
      province: {
        type: String,
        default: '',
      },
      district: {
        type: String,
        default: '',
      },
      commune: {
        type: String,
        default: '',
      },
      detail: {
        type: String,
        default: '',
      },
      isDefault: {
        type: Boolean,
        default: false,
      },
    },
    googleId: {
      type: String,
      unique: true,
    },
    refreshToken: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const UserRole = mongoose.model('UserRole', userRoleSchema);
const User = mongoose.model('User', userSchema);

export { User, UserRole };
