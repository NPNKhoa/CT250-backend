import { Order } from '../models/order.model.js';
import { Product } from '../models/product.model.js';
import { User } from '../models/user.model.js';
import logError from '../utils/logError.js';
import { OrderStatus } from '../models/order.model.js';

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

export const getRevenueByTime = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: 'Vui lòng cung cấp ngày bắt đầu và ngày kết thúc.' });
    }

    // Chuyển đổi startDate và endDate thành đối tượng Date
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setDate(start.getDate() + 1);
    end.setDate(end.getDate() + 1);
    end.setHours(23, 59, 59, 999); // Đặt thời gian kết thúc vào cuối ngày

    // Tạo một mảng chứa tất cả các ngày trong khoảng thời gian từ startDate đến endDate
    const daysArray = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      daysArray.push(new Date(d).toISOString().split('T')[0]); // Chỉ lấy phần ngày (YYYY-MM-DD)
    }

    // Lọc và nhóm các đơn hàng theo ngày, tính doanh thu và phân loại thanh toán
    const revenueData = await Order.aggregate([
      {
        $match: {
          orderDate: {
            $gte: start, // Lọc các đơn hàng từ ngày bắt đầu
            $lte: end, // Lọc đến ngày kết thúc
          },
        },
      },
      {
        $project: {
          _id: 1,
          totalPrice: 1,
          paymentStatus: 1,
          // Chuyển orderDate thành định dạng chuỗi ngày (YYYY-MM-DD)
          orderDate: {
            $dateToString: { format: '%Y-%m-%d', date: '$orderDate' },
          },
        },
      },
      {
        // Nhóm các đơn hàng theo ngày và phân loại doanh thu đã thanh toán và chưa thanh toán
        $group: {
          _id: '$orderDate',
          totalRevenue: { $sum: '$totalPrice' }, // Tính tổng doanh thu của ngày
          paidRevenue: {
            $sum: {
              $cond: [{ $eq: ['$paymentStatus', true] }, '$totalPrice', 0],
            }, // Doanh thu từ đơn hàng đã thanh toán
          },
          unpaidRevenue: {
            $sum: {
              $cond: [{ $eq: ['$paymentStatus', false] }, '$totalPrice', 0],
            }, // Doanh thu từ đơn hàng chưa thanh toán
          },
        },
      },
      {
        // Đặt tên lại cho trường `_id` thành `orderDate`
        $project: {
          _id: 0,
          orderDate: '$_id',
          totalRevenue: 1,
          paidRevenue: 1, // Doanh thu từ đơn hàng đã thanh toán
          unpaidRevenue: 1, // Doanh thu từ đơn hàng chưa thanh toán
        },
      },
    ]);

    const fullData = daysArray.map((day) => {
      const formattedDay = new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(new Date(day));

      const dayData = revenueData.find((data) => data.orderDate === day);

      return {
        time: formattedDay, // Định dạng ngày, tháng, năm
        totalRevenue: dayData ? dayData.totalRevenue : 0,
        paidRevenue: dayData ? dayData.paidRevenue : 0,
        unpaidRevenue: dayData ? dayData.unpaidRevenue : 0,
      };
    });

    // Trả về kết quả
    return res.status(200).json({
      message: 'Thống kê doanh thu và trạng thái thanh toán thành công',
      data: fullData,
      startDate,
      endDate,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: 'Đã có lỗi xảy ra, vui lòng thử lại sau.' });
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

    const monthNames = [
      'Tháng 1',
      'Tháng 2',
      'Tháng 3',
      'Tháng 4',
      'Tháng 5',
      'Tháng 6',
      'Tháng 7',
      'Tháng 8',
      'Tháng 9',
      'Tháng 10',
      'Tháng 11',
      'Tháng 12',
    ];

    // Gộp dữ liệu từ defaultRevenueData và revenueDataFromDB thành mảng kết quả cuối cùng
    const revenueData = defaultRevenueData.map((defaultMonth) => {
      const monthData = revenueDataFromDB.find(
        (dbMonth) => dbMonth.month === defaultMonth.month
      );
      const mergedData = monthData || defaultMonth; // Nếu không có dữ liệu từ DB, trả về giá trị mặc định

      return {
        time: monthNames[defaultMonth.month - 1], // Gắn tên tháng thay vì số
        totalRevenue: mergedData.totalRevenue,
        paidRevenue: mergedData.paidRevenue,
        unpaidRevenue: mergedData.unpaidRevenue,
      };
    });

    res.status(200).json({
      message: `Thống kê doanh thu năm ${currentYear}`,
      data: revenueData, // Trả về dữ liệu chung 1 mảng
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

    const data = [];

    // Lặp qua từng năm và tính doanh thu tổng thể
    for (const time of years) {
      const revenueDataFromDB = await Order.aggregate([
        {
          $match: {
            orderDate: {
              $gte: new Date(`${time}-01-01`),
              $lte: new Date(`${time}-12-31T23:59:59`),
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
      data.push({
        time,
        totalRevenue,
        paidRevenue,
        unpaidRevenue,
      });
    }

    res.status(200).json({
      message: 'Thống kê doanh thu tổng thể theo năm thành công.',
      data,
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

// Thống kê số lượng đơn hàng theo tháng trong năm
export const getTotalOrdersPerYear = async (req, res) => {
  try {
    const { year } = req.query;

    // Kiểm tra năm truyền vào, nếu không có thì sử dụng năm hiện tại
    const currentYear = year ? parseInt(year) : new Date().getFullYear();

    // Các trạng thái đơn hàng cần thống kê
    const orderStatus = await OrderStatus.find();

    const orderStatuses = orderStatus.map((status) => ({
      _id: status._id.toString(), // Chuyển đổi ObjectId thành chuỗi
      orderStatus: status.orderStatus,
    }));

    // Khởi tạo mảng để lưu trữ thống kê theo tháng
    const monthlyStatistics = Array.from({ length: 12 }, () => ({}));

    // Lặp qua từng trạng thái đơn hàng
    await Promise.all(
      orderStatuses.map(async (status) => {
        // Lặp qua từng tháng trong năm
        for (let month = 0; month < 12; month++) {
          const startOfMonth = new Date(currentYear, month, 1);
          const endOfMonth = new Date(currentYear, month + 1, 0, 23, 59, 59);

          // Đếm số đơn hàng theo trạng thái và thời gian
          const count = await Order.countDocuments({
            orderStatus: status._id,
            orderDate: {
              $gte: startOfMonth,
              $lt: endOfMonth,
            },
          });

          // Gán số lượng vào đối tượng tương ứng của tháng
          monthlyStatistics[month][status.orderStatus] = count;
        }
      })
    );

    // Tạo mảng kết quả để trả về
    const results = monthlyStatistics.map((stats, month) => ({
      month: month + 1, // Tháng (1-12)
      ...stats, // Gộp các trạng thái vào đối tượng kết quả
    }));

    res.status(200).json({
      message: `Tổng số đơn hàng theo trạng thái trong năm ${currentYear}`,
      statistics: results,
    });
  } catch (error) {
    console.error('Lỗi khi lấy thống kê số lượng đơn hàng:', error);
    res.status(500).json({ message: 'Có lỗi xảy ra', error });
  }
};

// Thống kê số lượng đơn hàng theo trạng thái cho từng năm
export const getTotalOrdersPerMonthByYear = async (req, res) => {
  try {
    // Lấy danh sách tất cả các năm có trong collection `orders`
    const years = await Order.distinct('orderDate').then((dates) => [
      ...new Set(dates.map((date) => new Date(date).getFullYear())),
    ]);

    const orderStatus = await OrderStatus.find();

    const orderStatuses = orderStatus.map((status) => ({
      _id: status._id.toString(), // Chuyển đổi ObjectId thành chuỗi
      orderStatus: status.orderStatus,
    }));

    const results = [];

    // Lặp qua từng năm và tính tổng số đơn hàng theo trạng thái
    for (const year of years) {
      const yearStats = { year }; // Khởi tạo đối tượng chứa thống kê cho năm
      await Promise.all(
        orderStatuses.map(async (status) => {
          // Đếm tổng số đơn hàng theo trạng thái cho năm
          const totalOrders = await Order.countDocuments({
            orderStatus: status._id,
            orderDate: {
              $gte: new Date(`${year}-01-01`),
              $lte: new Date(`${year}-12-31T23:59:59`),
            },
          });

          // Gán số lượng vào đối tượng yearStats
          yearStats[status.orderStatus] = totalOrders;
        })
      );
      results.push(yearStats); // Thêm kết quả thống kê của năm vào mảng results
    }

    res.status(200).json({
      message: 'Tổng số đơn hàng theo trạng thái trong từng năm',
      statistics: results,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const getTotalOrdersByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Kiểm tra dữ liệu ngày bắt đầu và kết thúc
    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: 'Cần cung cấp startDate và endDate' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setDate(start.getDate() + 1);
    end.setDate(end.getDate() + 1);
    end.setHours(23, 59, 59, 999);

    // Các trạng thái đơn hàng cần thống kê
    const orderStatus = await OrderStatus.find();

    const orderStatuses = orderStatus.map((status) => ({
      _id: status._id.toString(), // Chuyển đổi ObjectId thành chuỗi
      orderStatus: status.orderStatus,
    }));

    // Khởi tạo mảng để lưu trữ thống kê cho từng ngày
    const dailyStatistics = {};

    // Khởi tạo các ngày trong khoảng thời gian
    const currentDate = new Date(start);
    while (currentDate <= end) {
      // Khởi tạo đối tượng chứa số lượng đơn hàng cho mỗi trạng thái
      const statusCount = {};

      // Lặp qua từng trạng thái trong orderStatuses và khởi tạo giá trị 0
      orderStatuses.forEach((status) => {
        statusCount[status.orderStatus] = 0;
      });

      // Gán đối tượng statusCount vào dailyStatistics theo ngày
      dailyStatistics[currentDate.toISOString().split('T')[0]] = statusCount;

      // Tiến tới ngày tiếp theo
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Lặp qua từng trạng thái đơn hàng
    await Promise.all(
      orderStatuses.map(async (status) => {
        // Đếm số đơn hàng theo trạng thái và thời gian
        const orders = await Order.find({
          orderStatus: status._id,
          orderDate: {
            $gte: start,
            $lte: end,
          },
        });

        // Cập nhật số lượng đơn hàng cho từng ngày
        orders.forEach((order) => {
          const orderDate = order.orderDate.toISOString().split('T')[0];
          if (dailyStatistics[orderDate]) {
            dailyStatistics[orderDate][status.orderStatus] += 1;
          }
        });
      })
    );

    // Tạo mảng kết quả để trả về
    const results = Object.keys(dailyStatistics).map((date) => ({
      date,
      ...dailyStatistics[date],
    }));

    res.status(200).json({
      message: `Tổng số đơn hàng từ ${startDate} đến ${endDate}`,
      statistics: results,
    });
  } catch (error) {
    console.error('Lỗi khi lấy thống kê số lượng đơn hàng:', error);
    res.status(500).json({ message: 'Có lỗi xảy ra', error });
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

export const getProductTypeSalesPerYear = async (req, res) => {
  try {
    const { year } = req.query; // Nhận năm từ query (ví dụ: ?year=2024)

    if (!year) {
      return res.status(400).json({ message: 'Vui lòng cung cấp năm.' });
    }

    const result = await Order.aggregate([
      {
        $unwind: '$orderDetail',
      },
      {
        $lookup: {
          from: 'cartdetails',
          localField: 'orderDetail',
          foreignField: '_id',
          as: 'cartDetail',
        },
      },
      {
        $unwind: '$cartDetail',
      },
      {
        $lookup: {
          from: 'products',
          localField: 'cartDetail.product',
          foreignField: '_id',
          as: 'product',
        },
      },
      {
        $unwind: '$product',
      },
      {
        $lookup: {
          from: 'producttypes',
          localField: 'product.productType',
          foreignField: '_id',
          as: 'productType',
        },
      },
      {
        $unwind: '$productType',
      },
      {
        $addFields: {
          month: { $month: '$createdAt' },
          year: { $year: '$createdAt' },
        },
      },
      {
        // Lọc dữ liệu theo năm được cung cấp
        $match: {
          year: parseInt(year), // So sánh với năm từ query
        },
      },
      {
        $group: {
          _id: {
            month: '$month',
            year: '$year',
            productType: '$productType.productTypeName',
          },
          totalSold: { $sum: '$cartDetail.quantity' },
        },
      },
      {
        $group: {
          _id: {
            productType: '$_id.productType',
          },
          monthlySales: {
            $push: {
              month: '$_id.month',
              totalSold: '$totalSold',
            },
          },
        },
      },
      {
        $sort: {
          '_id.productType': 1,
        },
      },
      {
        $project: {
          _id: 0,
          productType: '$_id.productType',
          monthlySales: 1,
        },
      },
    ]);

    // Tạo mảng cho các tháng trong năm
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      totalSold: 0,
    }));

    // Tạo mảng cho các loại sản phẩm với doanh số cho từng tháng
    const productTypeSales = result.map((item) => {
      const salesForMonth = months.map((month) => {
        // Tìm tổng doanh số cho từng tháng
        const monthData = item.monthlySales.find(
          (ms) => ms.month === month.month
        );
        return {
          month: month.month,
          totalSold: monthData ? monthData.totalSold : 0, // Nếu không có dữ liệu, set về 0
        };
      });

      return {
        productType: item.productType,
        monthlySales: salesForMonth,
      };
    });

    // Nếu không có dữ liệu cho loại sản phẩm nào, thêm vào với doanh số = 0 cho từng tháng
    const defaultProductTypes = [
      'Túi vợt cầu lông',
      'Vợt cầu lông',
      'Balo cầu lông',
      // Thêm các productType khác nếu cần
    ];

    defaultProductTypes.forEach((productType) => {
      const found = productTypeSales.find(
        (pt) => pt.productType === productType
      );
      if (!found) {
        productTypeSales.push({
          productType,
          monthlySales: months.map((month) => ({
            month: month.month,
            totalSold: 0,
          })),
        });
      }
    });

    res.status(200).json({
      data: productTypeSales,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const getProductTypeSalesPerYears = async (req, res) => {
  try {
    // Nhận tất cả các năm trong dữ liệu
    const years = await Order.aggregate([
      {
        $addFields: {
          year: { $year: '$createdAt' },
        },
      },
      {
        $group: {
          _id: '$year',
        },
      },
      {
        $project: {
          _id: 0,
          year: '$_id',
        },
      },
    ]);

    // Nếu không có năm nào được tìm thấy
    if (!years || years.length === 0) {
      return res.status(404).json({ message: 'Không có dữ liệu năm nào.' });
    }

    // Thống kê doanh số cho mỗi năm
    const result = await Order.aggregate([
      {
        $unwind: '$orderDetail',
      },
      {
        $lookup: {
          from: 'cartdetails',
          localField: 'orderDetail',
          foreignField: '_id',
          as: 'cartDetail',
        },
      },
      {
        $unwind: '$cartDetail',
      },
      {
        $lookup: {
          from: 'products',
          localField: 'cartDetail.product',
          foreignField: '_id',
          as: 'product',
        },
      },
      {
        $unwind: '$product',
      },
      {
        $lookup: {
          from: 'producttypes',
          localField: 'product.productType',
          foreignField: '_id',
          as: 'productType',
        },
      },
      {
        $unwind: '$productType',
      },
      {
        $addFields: {
          year: { $year: '$createdAt' },
        },
      },
      {
        // Nhóm dữ liệu theo năm và loại sản phẩm
        $group: {
          _id: {
            year: '$year',
            productType: '$productType.productTypeName',
          },
          totalSold: { $sum: '$cartDetail.quantity' },
        },
      },
      {
        // Nhóm lại theo năm
        $group: {
          _id: '$_id.year',
          productTypes: {
            $push: {
              productType: '$_id.productType',
              totalSold: '$totalSold',
            },
          },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
      {
        $project: {
          _id: 0,
          year: '$_id',
          productTypes: 1,
        },
      },
    ]);

    // Nếu không có dữ liệu thống kê nào
    if (!result || result.length === 0) {
      return res
        .status(404)
        .json({ message: 'Không có dữ liệu bán hàng nào.' });
    }

    res.status(200).json({
      data: result,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const getTotalSoldPerMonth = async (req, res) => {
  try {
    // Lấy tháng và năm từ query (nếu không có thì dùng tháng hiện tại)
    const { month, year } = req.query;
    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();

    // Tính toán thời gian bắt đầu và kết thúc của tháng
    const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    // Kiểm tra đơn hàng trong tháng đã chọn
    const ordersInMonth = await Order.find({
      orderDate: { $gte: startOfMonth, $lte: endOfMonth },
    });

    if (ordersInMonth.length === 0) {
      return res
        .status(404)
        .json({ message: 'Không có đơn hàng nào trong tháng này.' });
    }

    const result = await Order.aggregate([
      {
        // Lọc các đơn hàng trong tháng được chọn
        $match: {
          orderDate: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
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
        // Lookup để lấy thông tin discount từ Discount collection
        $lookup: {
          from: 'discounts', // Tên collection của Discount
          localField: 'product.discount', // Tham chiếu tới discount của product
          foreignField: '_id', // _id từ Discount
          as: 'discount',
        },
      },
      {
        $unwind: {
          path: '$discount',
          preserveNullAndEmptyArrays: true, // Để đảm bảo nếu sản phẩm không có giảm giá thì vẫn hiện thông tin sản phẩm
        },
      },
      {
        // Nhóm theo từng sản phẩm và tính tổng số lượng đã bán
        $group: {
          _id: '$product._id', // Nhóm theo ID sản phẩm
          productCode: { $first: '$product.productCode' }, // Lấy mã sản phẩm
          productName: { $first: '$product.productName' }, // Lấy tên sản phẩm
          price: { $first: '$product.price' }, // Lấy giá sản phẩm
          discountPercent: { $first: '$discount.discountPercent' }, // Lấy phần trăm giảm giá
          discountStartDate: { $first: '$discount.discountStartDate' }, // Ngày bắt đầu giảm giá
          discountExpiredDate: { $first: '$discount.discountExpiredDate' }, // Ngày hết hạn giảm giá
          totalSold: { $sum: '$cartDetail.quantity' }, // Tính tổng số lượng sản phẩm đã bán
        },
      },
      {
        // Sắp xếp theo tổng số lượng bán từ cao đến thấp
        $sort: { totalSold: -1 },
      },
      {
        // Giới hạn chỉ lấy 10 sản phẩm bán nhiều nhất
        $limit: 10,
      },
      {
        // Tính tổng tất cả sản phẩm đã bán ra trong tháng
        $group: {
          _id: null,
          topProducts: {
            $push: {
              productId: '$_id',
              productName: '$productName',
              price: '$price',
              discountPercent: '$discountPercent', // Thêm discountPercent
              discountStartDate: '$discountStartDate', // Thêm discountStartDate
              discountExpiredDate: '$discountExpiredDate', // Thêm discountExpiredDate
              totalSold: '$totalSold',
            }, // Lưu trữ thông tin sản phẩm và số lượng bán
          },
          totalProductsSold: { $sum: '$totalSold' }, // Tính tổng tất cả sản phẩm đã bán
        },
      },
      {
        // Project để định dạng kết quả cuối cùng
        $project: {
          _id: 0, // Ẩn _id
          topProducts: 1, // Sản phẩm bán nhiều nhất và số lượng bán ra
          totalProductsSold: 1, // Tổng số sản phẩm đã bán trong tháng
        },
      },
    ]);

    if (!result || result.length === 0) {
      return res
        .status(404)
        .json({ message: 'Không có dữ liệu cho tháng này.' });
    }

    // Trả về danh sách top 10 sản phẩm bán nhiều nhất và tổng số sản phẩm đã bán trong tháng
    res.status(200).json({
      data: result[0], // Kết quả của aggregation
      error: false,
    });
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi lấy dữ liệu.',
      error: true,
    });
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
