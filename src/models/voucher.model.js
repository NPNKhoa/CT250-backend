import mongoose from 'mongoose';

const voucherSchema = new mongoose.Schema(
  {
    voucherCode: {
      type: String,
      required: true,
      unique: true,
      default: function () {
        const nameParts = this.voucherName.split('');
        const initials =
          Array.isArray(nameParts) &&
          nameParts.map((word) => word.charAt(0).toUppercase()).join('');
        const discount = this.discountPercent;
        const expired = this.expiredDate
          ? this.expiredDate.toIOString().slice(0, 10).replace(/-/g, '')
          : '';

        return `${initials}${discount}${expired}`;
      },
    },
    voucherName: {
      type: String,
      required: true,
      trim: true,
    },
    voucherType: {
      type: String,
      enum: ['public', 'private'],
      required: true,
      default: 'public',
    },
    discountPercent: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 0,
    },
    maxPriceDiscount: {
      type: Number,
      required: true,
      default: 500,
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    expiredDate: {
      type: Date,
      required: true,
      default: function () {
        const start = this.startDate || Date.now();
        const expired = new Date(start);
        expired.setDate(expired.getDate() + 30);

        return expired;
      },
    },
    maxUsage: {
      type: Number,
      required: function () {
        return this.voucherType === 'public';
      },
      min: 1,
    },
    collectedCount: {
      type: Number,
      default: 0,
      validate: {
        validator: function (value) {
          if (this.voucherType === 'public') {
            return value <= this.maxUsage;
          }
          return true;
        },
        message: 'Collected count exceeds maximum usage',
      },
    },
  },
  {
    timestamps: true,
  }
);

const userVoucherSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  voucherId: {
    type: mongoose.Types.ObjectId,
    ref: 'Voucher',
    default: null,
  },
  collectedAt: {
    type: Date,
    default: Date.now,
  },
});

const Voucher = mongoose.model('Voucher', voucherSchema);
const UserVoucher = mongoose.model('UserVoucher', userVoucherSchema);

export { Voucher, UserVoucher };
