import express from 'express';

// import { auth } from '../middlewares/authentication.js';
import {
  getRevenueForAllYears,
  getTotalOrdersPerMonthByYear,
  getTotalUsers,
  getTotalUsersByDate,
  getTotalUsersByYear,
  getTotalSoldPerMonth,
  getLatestOrders,
  getProductTypeSalesPerYears,
  getStatisticsByDateRange,
  getStatisticsByYear,
} from '../controllers/statictis.controller.js';
const router = express.Router();

router.get('/totalrevenueallyears', getRevenueForAllYears);

router.get('/totalordersallyear', getTotalOrdersPerMonthByYear);

router.get('/gettime', getStatisticsByDateRange);
router.get('/getyear', getStatisticsByYear);

router.get('/totalusers', getTotalUsers);
router.get('/totalusersbytime', getTotalUsersByDate);
router.get('/totalusersbyear', getTotalUsersByYear);

router.get('/quantityallyear', getProductTypeSalesPerYears);

router.get('/totalsoldpermonth', getTotalSoldPerMonth);
router.get('/lastedorders', getLatestOrders);

export default router;
