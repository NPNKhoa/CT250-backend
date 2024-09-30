import express from 'express';
import {
  collectVoucher,
  createVoucher,
  deleteVoucher,
  getAllVouchers,
  getPublishingVoucher,
  getVoucherById,
  updateVoucher,
} from '../controllers/voucher.controller.js';

const router = express.Router();

router.get('/', getAllVouchers);

router.get('/publishing', getPublishingVoucher);

router.get('/:id', getVoucherById);

router.post('/', createVoucher);

router.post('/collect', collectVoucher);

router.put('/:id', updateVoucher);

router.delete('/:id', deleteVoucher);

export default router;
