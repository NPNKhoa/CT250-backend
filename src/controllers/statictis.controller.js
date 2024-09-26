import { Order } from '../models/order.model.js';
import { Product } from '../models/product.model.js';
import { User } from '../models/user.model.js';
import logError from '../utils/logError.js';

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

export const getRevenueByYear = async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();

    const defaultRevenueData = Array.from({ length: 12 }, (_, index) => ({
      month: index + 1,
      totalRevenue: 0,
      paidRevenue: 0,
      unpaidRevenue: 0,
    }));

    const revenueDataFromDB = await Order.aggregate([
      {
        $match: {
          orderDate: {
            $gte: new Date(`${currentYear}-01-01`),
            $lte: new Date(`${currentYear}-12-31T23:59:59`),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$orderDate' }, // Nhóm theo tháng
          totalRevenue: { $sum: '$totalPrice' }, // Tổng doanh thu
          paidRevenue: {
            $sum: {
              $cond: [{ $eq: ['$paymentStatus', true] }, '$totalPrice', 0],
            },
          },
          unpaidRevenue: {
            $sum: {
              $cond: [{ $eq: ['$paymentStatus', false] }, '$totalPrice', 0],
            },
          },
        },
      },
      {
        $sort: { _id: 1 },
      },
      {
        $project: {
          month: '$_id',
          totalRevenue: 1,
          paidRevenue: 1,
          unpaidRevenue: 1,
          _id: 0,
        },
      },
    ]);

    const revenueData = defaultRevenueData.map((defaultMonth) => {
      const monthData = revenueDataFromDB.find(
        (dbMonth) => dbMonth.month === defaultMonth.month
      );
      return monthData || defaultMonth; // Nếu không có dữ liệu từ DB, trả về giá trị mặc định
    });

    // Nhóm các loại doanh thu thành mảng riêng biệt
    const totalRevenueData = revenueData.map((data) => data.totalRevenue);
    const paidRevenueData = revenueData.map((data) => data.paidRevenue);
    const unpaidRevenueData = revenueData.map((data) => data.unpaidRevenue);

    res.status(200).json({
      message: `Thống kê doanh thu năm ${currentYear}`,
      revenueData: {
        totalRevenueData,
        paidRevenueData,
        unpaidRevenueData,
      },
    });
  } catch (error) {
    console.error('Lỗi khi lấy thống kê doanh thu:', error);
    res.status(500).json({ message: 'Có lỗi xảy ra', error });
  }
};

export const getQuantityPerProductType = async (req, res) => {
  try {
    // Sử dụng aggregation để tính toán số lượng sản phẩm đã bán theo loại sản phẩm
    const result = await Order.aggregate([
      {
        // Tách từng orderDetail thành các document riêng
        $unwind: '$orderDetail',
      },
      {
        // Lookup để lấy thông tin sản phẩm từ CartDetail -> Product
        $lookup: {
          from: 'cartdetails', // Tên collection của CartDetail
          localField: 'orderDetail', // field để join từ Order
          foreignField: '_id', // field từ CartDetail
          as: 'cartDetail',
        },
      },
      {
        $unwind: '$cartDetail', // Mở rộng cartDetail (mảng) thành các document riêng
      },
      {
        // Lookup để lấy thông tin sản phẩm từ Product
        $lookup: {
          from: 'products', // Tên collection của Product
          localField: 'cartDetail.product', // product field từ CartDetail
          foreignField: '_id', // _id từ Product
          as: 'product',
        },
      },
      {
        $unwind: '$product', // Mở rộng product thành document riêng
      },
      {
        // Lookup để lấy thông tin productType từ ProductType
        $lookup: {
          from: 'producttypes', // Tên collection của ProductType
          localField: 'product.productType', // productType field từ Product
          foreignField: '_id', // _id từ ProductType
          as: 'productType',
        },
      },
      {
        $unwind: '$productType', // Mở rộng productType thành document riêng
      },
      {
        // Nhóm theo productTypeName và tính tổng số lượng sản phẩm
        $group: {
          _id: '$productType.productTypeName', // Nhóm theo tên loại sản phẩm
          totalSold: { $sum: '$cartDetail.quantity' }, // Tính tổng số lượng đã bán
        },
      },
      {
        // Tính tổng số lượng tất cả sản phẩm đã bán ra
        $group: {
          _id: null,
          productTypes: {
            $push: { productType: '$_id', totalSold: '$totalSold' },
          }, // Lưu trữ các loại sản phẩm và số lượng
          totalProductsSold: { $sum: '$totalSold' }, // Tính tổng sản phẩm đã bán
        },
      },
      {
        // Tính phần trăm và định dạng kết quả
        $unwind: '$productTypes', // Mở rộng các loại sản phẩm
      },
      {
        $addFields: {
          percentage: {
            $multiply: [
              { $divide: ['$productTypes.totalSold', '$totalProductsSold'] },
              100,
            ],
          }, // Tính phần trăm
        },
      },
      {
        // Project để định dạng kết quả cuối cùng
        $project: {
          _id: 0, // Ẩn _id
          productType: '$productTypes.productType', // Loại sản phẩm
          totalSold: '$productTypes.totalSold', // Số lượng sản phẩm đã bán
          percentage: { $round: ['$percentage', 2] }, // Làm tròn phần trăm đến 2 chữ số
        },
      },
    ]);

    if (!result || result.length === 0) {
      return res.status(404).json({ message: 'Không có dữ liệu.' });
    }

    res.status(200).json({
      data: result,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};
