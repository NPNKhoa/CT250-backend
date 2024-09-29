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

export const getRevenueForAllYears = async (req, res) => {
  try {
    // Lấy danh sách tất cả các năm có trong collection `orders`
    const years = await Order.distinct('orderDate').then((dates) => [
      ...new Set(dates.map((date) => new Date(date).getFullYear())),
    ]);

    const revenueResults = [];

    // Lặp qua từng năm và tính doanh thu tổng thể
    for (const year of years) {
      const revenueDataFromDB = await Order.aggregate([
        {
          $match: {
            orderDate: {
              $gte: new Date(`${year}-01-01`),
              $lte: new Date(`${year}-12-31T23:59:59`),
            },
          },
        },
        {
          $group: {
            _id: null, // Không nhóm theo bất kỳ trường nào để tính tổng
            totalRevenue: { $sum: '$totalPrice' },
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
      ]);

      // Nếu không có đơn hàng nào cho năm đó, khởi tạo doanh thu bằng 0
      const totalRevenue =
        revenueDataFromDB.length > 0 ? revenueDataFromDB[0].totalRevenue : 0;
      const paidRevenue =
        revenueDataFromDB.length > 0 ? revenueDataFromDB[0].paidRevenue : 0;
      const unpaidRevenue =
        revenueDataFromDB.length > 0 ? revenueDataFromDB[0].unpaidRevenue : 0;

      // Lưu kết quả cho từng năm
      revenueResults.push({
        year,
        totalRevenue,
        paidRevenue,
        unpaidRevenue,
      });
    }

    res.status(200).json({
      message: 'Thống kê doanh thu tổng thể theo năm thành công.',
      revenueResults,
    });
  } catch (error) {
    console.error('Lỗi khi lấy thống kê doanh thu:', error);
    res.status(500).json({ message: 'Có lỗi xảy ra', error });
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

export const getQuantityPerProductType = async (req, res) => {
  try {
    const result = await Order.aggregate([
      {
        // Tách từng orderDetail thành các document riêng
        $unwind: '$orderDetail',
      },
      {
        // Lookup để lấy thông tin sản phẩm từ CartDetail -> Product
        $lookup: {
          from: 'cartdetails',
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

export const getLatestOrders = async (req, res) => {
  try {
    const {
      orderStatus, // orderStatus is an objectid.
      startDate,
      endDate,
      userRole, // enum: ['staff', 'customer']
    } = req.query;

    const query = {};

    // Kiểm tra orderStatus
    if (orderStatus && isValidObjectId(orderStatus)) {
      query.orderStatus = orderStatus;
    }

    // Kiểm tra khoảng thời gian
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Kiểm tra userRole
    if (userRole) {
      if (userRole.toString().toLowerCase() === 'admin') {
        return res.status(400).json({
          error: 'Only accept customer and staff for filter condition',
        });
      }

      const role = await UserRole.findOne({ role: userRole.toLowerCase() });

      if (!role) {
        return res.status(400).json({
          error: 'Invalid role',
        });
      }

      const usersWithRole = await User.find({ role: role._id }).select('_id');

      query.user = { $in: usersWithRole.map((user) => user._id) };
    }

    // Tìm 10 đơn hàng gần nhất
    const orders = await Order.find(query)
      .populate('user', 'fullname')
      .populate('shippingAddress', '-isDefault -phone')
      .populate('shippingMethod')
      .populate('paymentMethod')
      .populate({
        path: 'orderDetail',
        populate: {
          path: 'product',
          select: 'productName productImagePath',
        },
      })
      .populate('orderStatus')
      .sort({ createdAt: -1 }) // Sắp xếp theo ngày tạo giảm dần
      .limit(10); // Giới hạn số lượng đơn hàng trả về

    // Trả về kết quả
    res.status(200).json({
      data: orders,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};
