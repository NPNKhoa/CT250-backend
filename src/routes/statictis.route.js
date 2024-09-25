import express from 'express';

// import { auth } from '../middlewares/authentication.js';
import {
  getTotalRevenue,
  getMonthlyRevenue,
  getTotalOrders,
  getTotalOrdersByMonth,
} from '../controllers/statictis.controller.js';
const router = express.Router();

router.get('/', getTotalRevenue);
router.get('/getmonthly', getMonthlyRevenue);

router.get('/totalorders', getTotalOrders);
router.get('/totalordersbymonth', getTotalOrdersByMonth);

export default router;
