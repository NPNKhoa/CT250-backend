import express from 'express';

// import { auth } from '../middlewares/authentication.js';
import {
  getTotalRevenue,
  getTotalRevenueByMonth,
  getRevenueByYear,
  getTotalOrders,
  getTotalOrdersByMonth,
  getTotalUsers,
  getTotalUsersByMonth,
} from '../controllers/statictis.controller.js';
const router = express.Router();

router.get('/totalrevenue', getTotalRevenue);
router.get('/totalrevenuebymonth', getTotalRevenueByMonth);
router.get('/totalrevenuebyyear', getRevenueByYear);

router.get('/totalorders', getTotalOrders);
router.get('/totalordersbymonth', getTotalOrdersByMonth);

router.get('/totalusers', getTotalUsers);
router.get('/totalusersbymonth', getTotalUsersByMonth);

export default router;
