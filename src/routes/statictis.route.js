import express from 'express';

// import { auth } from '../middlewares/authentication.js';
import {
  getTotalRevenue,
  getRevenueByTime,
  getTotalRevenueByMonth,
  getRevenueByYear,
  getRevenueForAllYears,
  getTotalOrders,
  getTotalOrdersByMonth,
  getTotalUsers,
  getTotalUsersByMonth,
  getQuantityPerProductType,
  getLatestOrders,
} from '../controllers/statictis.controller.js';
const router = express.Router();

router.get('/totalrevenue', getTotalRevenue);
router.get('/totalrevenuebytime', getRevenueByTime);
router.get('/totalrevenuebymonth', getTotalRevenueByMonth);
router.get('/totalrevenuebyyear', getRevenueByYear);
router.get('/totalrevenueallyears', getRevenueForAllYears);

router.get('/totalorders', getTotalOrders);
router.get('/totalordersbymonth', getTotalOrdersByMonth);

router.get('/totalusers', getTotalUsers);
router.get('/totalusersbymonth', getTotalUsersByMonth);

router.get('/quantityperproducttype', getQuantityPerProductType);
router.get('/lastedorders', getLatestOrders);

export default router;
