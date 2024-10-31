import { OrderStatus } from '../models/order.model.js';
import { Order } from '../models/order.model.js';
import { isValidObjectId } from '../utils/isValidObjectId.js';
import logError from '../utils/logError.js';
import { sendEmail } from '../services/email.service.js';

export const getAllOrderStatus = async (req, res) => {
  try {
    const orderStatus = await OrderStatus.find();

    if (!Array.isArray(orderStatus) || orderStatus.length === 0) {
      return res.status(404).json({
        error: 'Not found order status',
      });
    }

    res.status(200).json({
      data: orderStatus,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const getOrderStatusById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !isValidObjectId) {
      return res.status(400).json({
        error: 'Invalid object id',
      });
    }

    const orderStatus = await OrderStatus.findById(id);

    if (!orderStatus) {
      return res.status(404).json({
        error: 'Not found order status with this id',
      });
    }

    res.status(200).json({
      data: orderStatus,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const createOrderStatus = async (req, res) => {
  try {
    const { orderStatus } = req.body;

    if (!orderStatus) {
      return res.status(400).json({
        error: 'Missing required field',
      });
    }

    const existingOrderStatus = await OrderStatus.findOne({ orderStatus });

    if (existingOrderStatus) {
      return res.status(409).json({
        error: 'This order status is already exist',
      });
    }

    const createdOrderStatus = await OrderStatus.create({ orderStatus });

    res.status(201).json({
      data: createdOrderStatus,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !isValidObjectId) {
      return res.status(400).json({
        error: 'Invalid object id',
      });
    }

    const { orderStatus } = req.body;

    if (!orderStatus) {
      return res.status(400).json({
        error: 'order status can not be empty',
      });
    }

    const updatedOrderStatus = await OrderStatus.findByIdAndUpdate(
      id,
      { orderStatus },
      { new: true, runValidators: true }
    );

    if (!updatedOrderStatus) {
      return res.status(404).json({
        error: 'Can not found this order status to update',
      });
    }

    res.status(200).json({
      data: updatedOrderStatus,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const deleteOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !isValidObjectId) {
      return res.status(400).json({
        error: 'Invalid object id',
      });
    }

    const deletedOrderStatus = await OrderStatus.findByIdAndDelete(id);

    if (!deletedOrderStatus) {
      return res.status(404).json({
        error: 'Can not find this order status to delete',
      });
    }

    res.status(200).json({
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const getPendingOrdersOverdue = async (req, res) => {
  try {
    // Xác định thời gian 7 ngày trước
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Kiểm tra giá trị của sevenDaysAgo
    console.log('Thời gian 7 ngày trước:', sevenDaysAgo);

    // Tìm trạng thái "Chờ xử lý"
    const pendingStatus = await OrderStatus.findOne({
      orderStatus: 'Chờ xử lý',
    });

    if (!pendingStatus) {
      return res.status(404).json({
        error: 'Trạng thái "Chờ xử lý" không tồn tại trong hệ thống.',
      });
    }

    // Tìm các đơn hàng "Chờ xử lý" quá hạn 7 ngày dựa trên orderDate
    const overdueOrders = await Order.find({
      orderStatus: pendingStatus._id, // Trạng thái "Chờ xử lý"
      orderDate: { $lte: sevenDaysAgo }, // Ngày tạo đơn hàng trước 7 ngày
    })
      .populate('user', 'fullname email phone')
      .populate('shippingAddress', '-isDefault')
      .populate('shippingMethod')
      .populate('paymentMethod')
      .populate('voucher', 'discountPercent maxPriceDiscount expiredDate')
      .populate({
        path: 'orderDetail',
        populate: {
          path: 'product',
          select: 'productName productImagePath',
          populate: {
            path: 'discount',
            select: 'discountPercent',
          },
        },
      })
      .populate('orderStatus')
      .exec(); // Thực thi truy vấn

    // Trả về danh sách đơn hàng quá hạn
    res.status(200).json({
      message: `Có ${overdueOrders.length} đơn hàng chờ xử lý quá hạn.`,
      overdueOrders,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Lỗi khi lấy danh sách đơn hàng.',
      details: error.message,
    });
  }
};

export const cancelPendingOrdersOverdue = async (req, res) => {
  try {
    // Xác định thời gian 7 ngày trước
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Tìm trạng thái "Chờ xử lý" và "Đã hủy"
    const pendingStatus = await OrderStatus.findOne({
      orderStatus: 'Chờ xử lý',
    });
    const cancelledStatus = await OrderStatus.findOne({
      orderStatus: 'Đã hủy',
    });

    if (!pendingStatus || !cancelledStatus) {
      return res.status(400).json({
        error:
          'Trạng thái "Chờ xử lý" hoặc "Đã hủy" không tồn tại trong hệ thống.',
      });
    }

    // Tìm và cập nhật đơn hàng quá hạn 7 ngày
    const result = await Order.updateMany(
      {
        orderStatus: pendingStatus._id, // Trạng thái "Chờ xử lý"
        orderDate: { $lte: sevenDaysAgo }, // Ngày tạo đơn hàng trước 7 ngày
      },
      {
        orderStatus: cancelledStatus._id, // Cập nhật thành trạng thái "Đã hủy"
        updatedAt: new Date(), // Cập nhật thời gian chỉnh sửa
      }
    );

    // Lấy danh sách đơn hàng đã cập nhật để gửi email
    const ordersToUpdate = await Order.find({
      orderStatus: cancelledStatus._id,
    }).populate('user', 'fullname email phone');

    for (const order of ordersToUpdate) {
      const { user } = order; // Lấy thông tin người dùng

      const { error } = await sendEmail({
        from: 'clone.ct250@gmail.com',
        to: user.email,
        subject: 'Thông báo hủy đơn hàng',
        text: 'Đơn hàng của bạn đã quá hạn 7 ngày và đã bị hủy.',
        html: `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; background-color: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
    <h2 style="color: #333;">Thông báo hủy đơn hàng</h2>
    <p style="font-size: 16px;">Chào bạn,</p>
    <p style="font-size: 16px;">Chúng tôi xin thông báo rằng:</p>
    <p style="font-size: 16px; font-weight: bold; color: #e74c3c;">
      Đơn hàng <strong>#${order?._id}</strong> của bạn đã quá hạn 7 ngày và đã bị hủy.
    </p>
    <p style="font-size: 16px;">Chúng tôi rất tiếc vì sự bất tiện này. Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.</p>
    <p style="font-size: 16px;">Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
    <p style="font-size: 16px;">Trân trọng,<br>Đội ngũ hỗ trợ khách hàng</p>
  </div>
`,
      });

      if (error) {
        console.error(`Failed to send email to ${user.email}: ${error}`);
      }
    }

    res.status(200).json({
      message: `Cập nhật thành công ${result.nModified} đơn hàng chờ xử lý quá hạn thành hủy đơn.`,
      updatedOrders: ordersToUpdate,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Lỗi khi cập nhật đơn hàng.',
      details: error.message,
    });
  }
};
