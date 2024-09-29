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

const addressSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
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
  {
    timestamps: true,
  }
);

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
      required: function () {
        return !this.isSocialLogin;
      },
      minLength: 8,
    },
    phone: {
      type: String,
      required: function () {
        return !this.isSocialLogin;
      },
      default: '',
    },
    gender: {
      type: String,
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
      required: true,
    },
    address: [
      {
        type: mongoose.Types.ObjectId,
        ref: 'Address',
      },
    ],
    isSocialLogin: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
      default: null,
    },
    emailVerificationToken: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const UserRole = mongoose.model('UserRole', userRoleSchema);
const Address = mongoose.model('Address', addressSchema);
const User = mongoose.model('User', userSchema);

export { User, UserRole, Address };
