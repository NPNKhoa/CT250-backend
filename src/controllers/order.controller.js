import logError from '../utils/logError.js';
import { isValidObjectId } from '../utils/isValidObjectId.js';
import { validatePhone } from '../utils/validation.js';

import { Order } from '../models/order.model.js';
import { User, UserRole } from '../models/user.model.js';

import { createOrderService } from '../services/order.service.js';
import {
  generatePaymentUrl,
  handlePaymentReturn,
} from '../services/payment.service.js';
import { populate } from 'dotenv';

export const createOrder = async (req, res) => {
  try {
    const { userId } = req.userId;

    if (!userId) {
      return res.status(401).json({
        error: 'Invalid credentials',
      });
    }

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        error: 'Invalid user id',
      });
    }

    const {
      orderDetail,
      shippingAddress,
      shippingMethod,
      shippingFee,
      paymentMethod,
      voucherId,
    } = req.body;

    if (!shippingAddress || !shippingMethod || !shippingFee || !paymentMethod) {
      return res.status(400).json({
        error: 'Missing required fields',
      });
    }

    if (voucherId && !isValidObjectId(voucherId)) {
      return res.status(400).json({
        error: 'Invalid voucher id',
      });
    }

    if (!Array.isArray(orderDetail) || orderDetail.length === 0) {
      return res.status(400).json({
        error: 'Can not create order without products',
      });
    }

    const createdOrder = await createOrderService({
      userId,
      orderDetail,
      shippingAddress,
      shippingMethod,
      shippingFee,
      paymentMethod,
      voucherId,
    });

    if (createdOrder.data === null) {
      return res.status(createdOrder.status).json({
        error: createdOrder.error,
      });
    }

    if (paymentMethod === '66e0a2a47aeb0c01762fed3e') {
      const ipAddr =
        req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress ||
        req.ip;

      const locale = req.body.language || 'vn';

      const vnpUrl = generatePaymentUrl({
        orderId: createdOrder.data._id,
        amount: createdOrder.data.totalPrice,
        ipAddr,
        locale,
      });

      return res.status(200).json({
        error: false,
        redirectUrl: vnpUrl,
      });
    }

    res.status(createdOrder.status).json({
      data: createdOrder.data,
      error: createdOrder.error,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      orderStatus, // orderStatus is an objectid.
      startDate,
      endDate,
      userRole, // enum: ['staff', 'customer']
    } = req.query;

    const query = {};

    if (orderStatus && isValidObjectId(orderStatus)) {
      query.orderStatus = orderStatus;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

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

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    const orders = await Order.find(query)
      .populate('user', 'fullname email phone')
      .populate('shippingAddress', '-isDefault')
      .populate('shippingMethod')
      .populate('paymentMethod')
      .populate('voucher', 'discountPercent')
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
      .skip((pageNumber - 1) * limitNumber)
      .limit(parseInt(limitNumber));

    // build a query string and enable filter functionality for order status

    const totalDocs = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalDocs / limitNumber);

    res.status(200).json({
      data: orders,
      meta: {
        totalDocs,
        totalPages,
        currentPage: page,
        limit,
      },
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const getOrderByUser = async (req, res) => {
  try {
    const { userId } = req.userId;
    const { page = 1, limit = 5, orderStatus, isLatest } = req.query; // objectid

    const query = {};

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        error: 'Invalid order id',
      });
    }

    query.user = userId;

    if (orderStatus) {
      if (!isValidObjectId(orderStatus)) {
        return res.status(400).json({
          error: 'Invalid order status id',
        });
      }
      query.orderStatus = orderStatus;
    }

    let sortOptions = {};

    if (isLatest === 'latest') {
      sortOptions = { createdAt: -1 };
    } else {
      sortOptions = { createdAt: 1 };
    }

    const order = await Order.find(query)
      .populate('user', 'fullname')
      .populate('shippingAddress', '-isDefault')
      .populate('shippingMethod')
      .populate('paymentMethod')
      .populate('voucher', 'discountPercent')
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
      .populate({
        path: 'orderStatus',
        select: 'orderStatus',
      })
      .sort(sortOptions)
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber);

    if (!order) {
      return res.status(404).json({
        error: 'Order not found',
      });
    }

    const totalDocs = await Order.countDocuments({ user: userId });
    const totalPages = Math.ceil(totalDocs / limitNumber);

    res.status(200).json({
      data: order,
      meta: {
        totalDocs,
        totalPages,
        currentPage: pageNumber,
        limit: limitNumber,
      },
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id: orderId } = req.params;
    const { orderStatus } = req.body;

    if (!isValidObjectId(orderId)) {
      return res.status(400).json({
        error: 'Invalid order id',
      });
    }

    if (!isValidObjectId(orderStatus)) {
      return res.status(400).json({
        error: 'Invalid order status id',
      });
    }

    const existingOrder = await Order.findById(orderId);

    if (!existingOrder) {
      return res.status(404).json({
        error: 'Order not found',
      });
    }

    existingOrder.orderStatus = orderStatus;
    if (orderStatus === '6710b30f130cc0804e87c9a7') {
      existingOrder.paymentStatus = true;
      existingOrder.paidDate = new Date();
    }
    await existingOrder.save();

    const updatedOrder = await Order.findById(existingOrder._id)
      .populate('user', 'fullname email phone')
      .populate('shippingAddress', '-isDefault')
      .populate('shippingMethod')
      .populate('paymentMethod')
      .populate('voucher', 'discountPercent')
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
      .populate('orderStatus');

    res.status(200).json({
      data: updatedOrder,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { id: orderId } = req.params;

    if (!isValidObjectId(orderId)) {
      return res.status(400).json({
        error: 'Invalid Id format',
      });
    }

    const existingOrder = await Order.findById(orderId)
      .populate('user', 'fullname')
      .populate('shippingAddress', '-isDefault -phone')
      .populate('shippingMethod')
      .populate('paymentMethod')
      .populate({
        path: 'orderDetail',
        populate: {
          path: 'product',
          select: 'productName discount productImagePath',
          populate: {
            path: 'discount',
            select: 'discountPercent discountExpiredDate',
          },
        },
      })
      .populate({
        path: 'orderStatus',
        select: 'orderStatus',
      });
    if (!existingOrder) {
      return res.status(404).json({
        error: 'Order not found',
      });
    }

    res.status(200).json({
      data: existingOrder,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const getOrderByPhoneNumber = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!validatePhone(phone)) {
      return res.status(400).json({
        error: 'Invalid phone number format',
      });
    }

    const existingOrders = await Order.find()
      .populate('shippingAddress')
      .populate('user', 'fullname')
      .populate('shippingMethod')
      .populate('paymentMethod')

      .populate({
        path: 'orderDetail',
        populate: {
          path: 'product',
          select: 'productName productImagePath',
        },
      })
      .populate({
        path: 'orderStatus',
        select: 'orderStatus',
      });

    const filteredOrders = existingOrders.filter(
      (order) => order.shippingAddress !== null
    );

    if (filteredOrders.length === 0) {
      return res.status(404).json({
        error: 'Not found orders with this phone',
      });
    }

    res.status(200).json({
      data: filteredOrders,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

// export const createOnlinePayment = async (req, res) => {
//   try {
//     // Create Order
//     const { userId } = req.userId;

//     if (!userId) {
//       return res.status(401).json({
//         error: 'Invalid credentials',
//       });
//     }

//     if (!isValidObjectId(userId)) {
//       return res.status(400).json({
//         error: 'Invalid user id',
//       });
//     }

//     const {
//       orderDetail,
//       shippingAddress,
//       shippingMethod,
//       shippingFee,
//       paymentMethod,
//     } = req.body;

//     if (!shippingAddress || !shippingMethod || !shippingFee || !paymentMethod) {
//       return res.status(400).json({
//         error: 'Missing required fields',
//       });
//     }

//     if (!Array.isArray(orderDetail) || orderDetail.length === 0) {
//       return res.status(400).json({
//         error: 'Can not create order without products',
//       });
//     }

//     const createdOrder = await createOrderService({
//       userId,
//       orderDetail,
//       shippingAddress,
//       shippingMethod,
//       shippingFee,
//       paymentMethod,
//     });

//     if (createdOrder.status !== 200 || createdOrder.status !== 201) {
//       return res.status(createdOrder.status).json({
//         error: createdOrder.error,
//       });
//     }

//     res.status(createdOrder.status).json({
//       data: createdOrder.data,
//       error: createdOrder.error,
//     });

//     // VNPay
//   } catch (error) {
//     logError(error, res);
//   }
// };

export const vnpReturn = async (req, res) => {
  const vnp_Params = req.query;

  const paymentReturnData = await handlePaymentReturn(vnp_Params);

  if (!paymentReturnData.success) {
    return res.status(400).json({
      error: paymentReturnData.message,
      vnp_Code: paymentReturnData?.vnp_Code,
    });
  }

  res.redirect(`${process.env.FRONTEND_URL}/thankyou`);
};

// export const vnpIpn = async (req, res) => {
//   try {
//     const vnp_Params = req.query;

//     const secureHash = vnp_Params['vnp_SecureHash'];
//     const rspCode = vnp_Params['vnp_ResponseCode'];
//     let orderId = vnp_Params['vnp_TxnRef'];

//     delete vnp_Params['vnp_SecureHash'];
//     delete vnp_Params['vnp_SecureHashType'];

//     const secretKey = env.VNP_HASH_SECRET;

//     const signData = QueryString.stringify(vnp_Params, { encode: false });
//     // const hmac = crypto.createHmac('sha512', secretKey);
//     // const signed = hmac.update(new Buffer(signData, 'utf-8')).digest('hex');
//     const signed = createHmacSignature(signData, secretKey);

//     let paymentStatus = '0'; // Giả sử '0' là trạng thái khởi tạo giao dịch, chưa có IPN. Trạng thái này được lưu khi yêu cầu thanh toán chuyển hướng sang Cổng thanh toán VNPAY tại đầu khởi tạo đơn hàng.
//     //let paymentStatus = '1'; // Giả sử '1' là trạng thái thành công bạn cập nhật sau IPN được gọi và trả kết quả về nó
//     //let paymentStatus = '2'; // Giả sử '2' là trạng thái thất bại bạn cập nhật sau IPN được gọi và trả kết quả về nó

//     if (secureHash === signed) {
//       const order = await Order.findOne({ orderId });
//       const checkOrderId = !!order; // true nếu đơn hàng tồn tại, false nếu không

//       if (checkOrderId) {
//         let checkAmount = false;

//         if (order) {
//           const vnp_Amount = parseInt(vnp_Params['vnp_Amount'], 10) / 100; // Chia 100 để lấy số tiền thực tế
//           checkAmount = order.totalPrice === vnp_Amount;
//         }

//         if (checkAmount) {
//           if (paymentStatus == '0') {
//             if (rspCode == '00') {
//               // Thanh toán thành công
//               res
//                 .status(200)
//                 .json({ RspCode: '00', Message: 'Success', error: false });
//             } else {
//               // Thanh toán thất bại
//               res.status(200).json({
//                 RspCode: '00',
//                 Message: 'Success',
//                 error: 'Thanh toán thất bại',
//               });
//             }
//           } else {
//             res.status(200).json({
//               RspCode: '02',
//               Message: 'This order has been updated to the payment status',
//               error: 'Thanh toán thất bại',
//             });
//           }
//         } else {
//           res.status(200).json({
//             RspCode: '04',
//             Message: 'Amount invalid',
//             error: 'Thanh toán thất bại',
//           });
//         }
//       } else {
//         res.status(200).json({
//           RspCode: '01',
//           Message: 'Order not found',
//           error: 'Thanh toán thất bại',
//         });
//       }
//     } else {
//       res.status(200).json({
//         RspCode: '97',
//         Message: 'Checksum failed',
//         error: 'Thanh toán thất bại',
//       });
//     }
//   } catch (error) {
//     logError(error, res);
//   }
// };

export const getLastOrders = async (req, res) => {
  try {
    // Lấy số lượng đơn hàng mới từ tham số truy vấn (mặc định là 3)
    const limit = parseInt(req.query.limit) || 3;

    const latestOrders = await Order.find({})
      .sort({ orderDate: -1 })
      .limit(limit) // Giới hạn số lượng đơn hàng được trả về
      .populate('user', 'fullname email')
      .populate('shippingAddress', '-isDefault')
      .populate('shippingMethod')
      .populate('paymentMethod')
      .populate('orderStatus', 'orderStatus')
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
      .populate('voucher', 'discountPercent');

    if (!latestOrders.length) {
      return res.status(404).json({ error: 'No orders found' });
    }

    res.status(200).json({
      data: latestOrders,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};
