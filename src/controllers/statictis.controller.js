import { Order } from '../models/order.model.js';
import logError from '../utils/logError.js';
import { User } from '../models/user.model.js';
import { isValidObjectId } from '../utils/isValidObjectId.js';

export const getTotalRevenue = async (req, res) => {
  try {
    const totalRevenue = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalPrice' },
        },
      },
    ]);

    if (totalRevenue.length === 0) {
      return res.status(404).json({ message: 'Không có đơn hàng nào.' });
    }

    res.status(200).json({
      message: 'Thống kê doanh thu thành công.',
      totalRevenue: totalRevenue[0].totalRevenue,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const getTotalRevenueByMonth = async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();

    const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    const totalRevenue = await Order.aggregate([
      {
        $match: {
          orderDate: {
            $gte: startOfMonth,
            $lte: endOfMonth,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalPrice' },
        },
      },
    ]);

    if (totalRevenue.length === 0) {
      return res
        .status(404)
        .json({ message: 'Không có đơn hàng nào trong tháng.' });
    }

    res.status(200).json({
      message: `Thống kê doanh thu tháng ${currentMonth}/${currentYear} thành công.`,
      totalRevenue: totalRevenue[0].totalRevenue,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const getTotalOrders = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments({});
    res.status(200).json({
      message: 'Tính tổng số đơn hàng thành công.',
      totalOrders,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const getTotalOrdersByMonth = async (req, res) => {
  try {
    const { month, year } = req.query;

    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();

    const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    const totalOrdersByMonth = await Order.countDocuments({
      orderDate: {
        $gte: startOfMonth,
        $lte: endOfMonth,
      },
    });

    res.status(200).json({
      message: `Tổng số đơn hàng tháng ${currentMonth}/${currentYear}`,
      totalOrdersByMonth,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const getTotalUsers = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({});

    res.status(200).json({
      message: 'Số lượng tài khoản người dùng hiện có.',
      totalUsers,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const getTotalUsersByMonth = async (req, res) => {
  try {
    const { month, year } = req.query;

    // Nếu không có tham số month và year thì lấy tháng và năm hiện tại
    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();

    const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    const newAccountsCount = await User.countDocuments({
      createdAt: {
        $gte: startOfMonth,
        $lte: endOfMonth,
      },
    });

    res.status(200).json({
      message: `Số tài khoản mới trong tháng ${currentMonth}/${currentYear}`,
      newAccountsCount,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};
