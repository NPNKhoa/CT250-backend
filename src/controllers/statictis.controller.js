import { Order } from '../models/order.model.js';
import { User } from '../models/user.model.js';
import logError from '../utils/logError.js';
import { OrderStatus } from '../models/order.model.js';

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

export const getStatisticsByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: 'Vui lòng cung cấp ngày bắt đầu và ngày kết thúc.' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setDate(start.getDate() + 1);
    end.setDate(end.getDate() + 1);
    end.setHours(23, 59, 59, 999); // Đặt giờ cuối cùng trong ngày kết thúc

    const daysArray = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      daysArray.push(new Date(d).toISOString().split('T')[0]);
    }

    // 1. Tính doanh thu và tổng số lượng đơn hàng theo từng ngày
    const revenueData = await Order.aggregate([
      {
        $match: {
          orderDate: {
            $gte: start,
            $lte: end,
          },
        },
      },
      {
        $project: {
          totalPrice: 1,
          paymentStatus: 1,
          orderDate: {
            $dateToString: { format: '%Y-%m-%d', date: '$orderDate' },
          },
        },
      },
      {
        $group: {
          _id: '$orderDate',
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
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    // 2. Lấy tổng số đơn hàng theo từng trạng thái
    const orderStatusData = await Order.aggregate([
      {
        $match: {
          orderDate: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: {
            orderStatus: '$orderStatus',
            orderDate: {
              $dateToString: { format: '%Y-%m-%d', date: '$orderDate' },
            },
          },
          totalOrders: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'orderstatuses',
          localField: '_id.orderStatus',
          foreignField: '_id',
          as: 'statusInfo',
        },
      },
      {
        $unwind: '$statusInfo',
      },
      {
        $project: {
          _id: 0,
          orderStatus: '$statusInfo.orderStatus',
          orderDate: '$_id.orderDate', // Thêm trường orderDate vào kết quả
          totalOrders: 1,
        },
      },
    ]);

    // 3. Tính tổng số lượng sản phẩm bán ra theo loại sản phẩm
    const productTypeData = await Order.aggregate([
      {
        $match: {
          orderDate: { $gte: start, $lte: end },
        },
      },
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
        $group: {
          _id: {
            productTypeName: '$productType.productTypeName',
            orderDate: {
              $dateToString: { format: '%Y-%m-%d', date: '$orderDate' },
            },
          },
          totalSold: { $sum: '$cartDetail.quantity' },
        },
      },
      {
        $group: {
          _id: '$_id.orderDate',
          productTypes: {
            $push: {
              productType: '$_id.productTypeName',
              totalSold: '$totalSold',
            },
          },
          totalProductsSold: { $sum: '$totalSold' },
        },
      },
    ]);

    // Tính tổng doanh thu và tổng đơn hàng trong toàn bộ khoảng thời gian
    const totalStatistics = revenueData.reduce(
      (acc, day) => {
        acc.totalRevenue += day.totalRevenue;
        acc.totalOrders += day.totalOrders;
        return acc;
      },
      { totalRevenue: 0, totalOrders: 0 }
    );

    // 4. Xây dựng dữ liệu trả về với các thống kê đã yêu cầu
    const fullData = daysArray.map((day) => {
      const formattedDay = new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(new Date(day));

      // Tìm dữ liệu doanh thu cho ngày đó
      const dayRevenueData = revenueData.find((data) => data._id === day) || {
        totalRevenue: 0,
        paidRevenue: 0,
        unpaidRevenue: 0,
        totalOrders: 0,
      };

      // Tìm dữ liệu thống kê loại sản phẩm cho ngày đó
      const productTypeStats =
        productTypeData.find((data) => data._id === day)?.productTypes || [];
      const totalProductsSold =
        productTypeData.find((data) => data._id === day)?.totalProductsSold ||
        0;

      // Nếu không có loại sản phẩm nào thì thêm giá trị mặc định
      const defaultProductTypes = [
        { productType: 'Túi vợt cầu lông', totalSold: 0 },
        { productType: 'Vợt cầu lông', totalSold: 0 },
        { productType: 'Balo cầu lông', totalSold: 0 },
      ];

      const finalProductTypes = defaultProductTypes.map((defaultType) => {
        const actualType = productTypeStats.find(
          (type) => type.productType === defaultType.productType
        );
        return actualType || defaultType; // Nếu không có, giữ giá trị mặc định
      });

      // Lấy thông tin tổng đơn hàng theo trạng thái cho ngày đó
      const orderStatusForDay = orderStatusData
        .filter((status) => status.orderDate === day) // Lọc ra trạng thái theo ngày hiện tại
        .reduce((acc, status) => {
          if (!acc[status.orderStatus]) {
            acc[status.orderStatus] = 0;
          }
          acc[status.orderStatus] += status.totalOrders;
          return acc;
        }, {});

      return {
        time: formattedDay,
        totalRevenue: dayRevenueData.totalRevenue,
        paidRevenue: dayRevenueData.paidRevenue,
        unpaidRevenue: dayRevenueData.unpaidRevenue,
        totalOrders: dayRevenueData.totalOrders,
        orderStatusSummary: [
          {
            orderStatus: 'Chờ xử lý',
            totalOrders: orderStatusForDay['Chờ xử lý'] || 0,
          },
          {
            orderStatus: 'Đã giao hàng',
            totalOrders: orderStatusForDay['Đã giao hàng'] || 0,
          },
          // Bạn có thể thêm nhiều trạng thái khác nếu cần
        ],
        productTypeStatistics: [
          {
            productTypes: finalProductTypes,
            totalProductsSold: totalProductsSold,
          },
        ],
      };
    });

    return res.status(200).json({
      message: 'Thống kê thành công',
      data: {
        statisticsByDate: fullData,
        totalRevenue: totalStatistics.totalRevenue,
        totalOrders: totalStatistics.totalOrders,
        totalProductsSold: productTypeData[0]?.totalProductsSold || 0,
        productTypeSummary: productTypeData[0]?.productTypes || [],
      },
      startDate,
      endDate,
    });
  } catch (error) {
    console.error('Lỗi khi lấy thống kê:', error);
    return res
      .status(500)
      .json({ message: 'Có lỗi xảy ra, vui lòng thử lại sau.' });
  }
};

export const getStatisticsByYear = async (req, res) => {
  try {
    const { year } = req.query;

    if (!year) {
      return res.status(400).json({ message: 'Vui lòng cung cấp năm.' });
    }

    const start = new Date(`${year}-01-01`);
    const end = new Date(`${year}-12-31`);
    end.setHours(23, 59, 59, 999); // Đặt giờ cuối cùng của ngày cuối năm

    // Tạo mảng chứa các tháng trong năm
    const monthsArray = Array.from({ length: 12 }, (_, i) => i + 1);

    // 1. Tính doanh thu và tổng số lượng đơn hàng theo từng tháng
    const revenueData = await Order.aggregate([
      {
        $match: {
          orderDate: {
            $gte: start,
            $lte: end,
          },
        },
      },
      {
        $project: {
          totalPrice: 1,
          paymentStatus: 1,
          month: { $month: '$orderDate' }, // Lấy tháng từ orderDate
        },
      },
      {
        $group: {
          _id: '$month', // Nhóm theo tháng
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
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    // 2. Lấy tổng số đơn hàng theo từng trạng thái trong từng tháng
    const orderStatusData = await Order.aggregate([
      {
        $match: {
          orderDate: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: {
            orderStatus: '$orderStatus',
            month: { $month: '$orderDate' }, // Lấy tháng từ orderDate
          },
          totalOrders: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'orderstatuses',
          localField: '_id.orderStatus',
          foreignField: '_id',
          as: 'statusInfo',
        },
      },
      {
        $unwind: '$statusInfo',
      },
      {
        $project: {
          _id: 0,
          orderStatus: '$statusInfo.orderStatus',
          month: '$_id.month',
          totalOrders: 1,
        },
      },
    ]);

    // 3. Tính tổng số lượng sản phẩm bán ra theo loại sản phẩm trong từng tháng
    const productTypeData = await Order.aggregate([
      {
        $match: {
          orderDate: { $gte: start, $lte: end },
        },
      },
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
        $group: {
          _id: {
            productTypeName: '$productType.productTypeName',
            month: { $month: '$orderDate' }, // Lấy tháng từ orderDate
          },
          totalSold: { $sum: '$cartDetail.quantity' },
        },
      },
      {
        $group: {
          _id: '$_id.month',
          productTypes: {
            $push: {
              productType: '$_id.productTypeName',
              totalSold: '$totalSold',
            },
          },
          totalProductsSold: { $sum: '$totalSold' },
        },
      },
    ]);

    // Tính tổng doanh thu và tổng đơn hàng trong toàn bộ năm
    const totalStatistics = revenueData.reduce(
      (acc, month) => {
        acc.totalRevenue += month.totalRevenue;
        acc.totalOrders += month.totalOrders;
        return acc;
      },
      { totalRevenue: 0, totalOrders: 0 }
    );

    // 4. Xây dựng dữ liệu trả về với các thống kê đã yêu cầu
    const fullData = monthsArray.map((month) => {
      // Tìm dữ liệu doanh thu cho tháng đó
      const monthRevenueData = revenueData.find(
        (data) => data._id === month
      ) || {
        totalRevenue: 0,
        paidRevenue: 0,
        unpaidRevenue: 0,
        totalOrders: 0,
      };

      // Tìm dữ liệu thống kê loại sản phẩm cho tháng đó
      const productTypeStats =
        productTypeData.find((data) => data._id === month)?.productTypes || [];
      const totalProductsSold =
        productTypeData.find((data) => data._id === month)?.totalProductsSold ||
        0;

      // Thêm giá trị mặc định cho các loại sản phẩm nếu không có dữ liệu
      const defaultProductTypes = [
        { productType: 'Túi vợt cầu lông', totalSold: 0 },
        { productType: 'Vợt cầu lông', totalSold: 0 },
        { productType: 'Balo cầu lông', totalSold: 0 },
      ];

      const finalProductTypes = defaultProductTypes.map((defaultType) => {
        const actualType = productTypeStats.find(
          (type) => type.productType === defaultType.productType
        );
        return actualType || defaultType; // Nếu không có, giữ giá trị mặc định
      });

      // Lấy thông tin tổng đơn hàng theo trạng thái cho tháng đó
      const orderStatusForMonth = orderStatusData
        .filter((status) => status.month === month)
        .reduce((acc, status) => {
          if (!acc[status.orderStatus]) {
            acc[status.orderStatus] = 0;
          }
          acc[status.orderStatus] += status.totalOrders;
          return acc;
        }, {});

      return {
        month: `Tháng ${month}`,
        totalRevenue: monthRevenueData.totalRevenue,
        paidRevenue: monthRevenueData.paidRevenue,
        unpaidRevenue: monthRevenueData.unpaidRevenue,
        totalOrders: monthRevenueData.totalOrders,
        orderStatusSummary: [
          {
            orderStatus: 'Chờ xử lý',
            totalOrders: orderStatusForMonth['Chờ xử lý'] || 0,
          },
          {
            orderStatus: 'Đã giao hàng',
            totalOrders: orderStatusForMonth['Đã giao hàng'] || 0,
          },
          // Bạn có thể thêm nhiều trạng thái khác nếu cần
        ],
        productTypeStatistics: [
          {
            productTypes: finalProductTypes,
            totalProductsSold: totalProductsSold,
          },
        ],
      };
    });

    return res.status(200).json({
      message: 'Thống kê thành công',
      data: {
        statisticsByMonth: fullData,
        totalRevenue: totalStatistics.totalRevenue,
        totalOrders: totalStatistics.totalOrders,
        totalProductsSold: productTypeData[0]?.totalProductsSold || 0,
        productTypeSummary: productTypeData[0]?.productTypes || [],
      },
      year,
    });
  } catch (error) {
    console.error('Lỗi khi lấy thống kê:', error);
    return res
      .status(500)
      .json({ message: 'Có lỗi xảy ra, vui lòng thử lại sau.' });
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
