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
  getTotalOrdersPerMonthByYear,
  getTotalOrdersByDateRange,
  getTotalOrdersPerYear,
  getTotalUsers,
  getTotalUsersByMonth,
  getQuantityPerProductType,
  getTotalSoldPerMonth,
  getLatestOrders,
  getProductTypeSalesPerYear,
  getProductTypeSalesPerYears,
} from '../controllers/statictis.controller.js';
const router = express.Router();

router.get('/totalrevenue', getTotalRevenue);
router.get('/totalrevenuebytime', getRevenueByTime);
router.get('/totalrevenuebymonth', getTotalRevenueByMonth);
router.get('/totalrevenuebyyear', getRevenueByYear);
router.get('/totalrevenueallyears', getRevenueForAllYears);

router.get('/totalorders', getTotalOrders);
router.get('/totalordersbymonth', getTotalOrdersByMonth);
router.get('/totalordersperyear', getTotalOrdersPerYear);
router.get('/totalordersallyear', getTotalOrdersPerMonthByYear);
router.get('/totalorderbytime', getTotalOrdersByDateRange);

router.get('/totalusers', getTotalUsers);
router.get('/totalusersbymonth', getTotalUsersByMonth);

router.get('/quantityperproducttype', getQuantityPerProductType);
router.get('/quantityperyear', getProductTypeSalesPerYear);
router.get('/quantityallyear', getProductTypeSalesPerYears);

router.get('/totalsoldpermonth', getTotalSoldPerMonth);
router.get('/lastedorders', getLatestOrders);

export default router;
