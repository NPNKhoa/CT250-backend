import express from 'express';

import upload from '../configs/multerConfig.js';
import {
  addBanner,
  addCoreValue,
  addFilterPercent,
  addFounder,
  backupConfig,
  createConfig,
  deleteBanner,
  deleteCoreValue,
  deleteFilterPercent,
  deleteFounder,
  getActiveBanners,
  getAllBanners,
  getCoreValue,
  getCurrentConfig,
  getFilterPercent,
  getFounder,
  updateActiveBanner,
  updateConfig,
} from '../controllers/systemConfig.controller.js';

const router = express.Router();

router.get('/current', getCurrentConfig);

router.get('/banners', getAllBanners);

router.get('/banners/active', getActiveBanners);

router.get('/founder', getFounder);

router.get('/core-value', getCoreValue);

router.get('/percent-filter', getFilterPercent);

router.post('/', upload.single('shopLogoImgPath'), createConfig);

router.post('/core-value', addCoreValue);

router.post('/banners', upload.array('bannerImgPath'), addBanner);

router.post('/percent-filter', addFilterPercent);

router.post('/founder', upload.single('founderAvatarPath'), addFounder);

router.post('/backup', backupConfig);

router.put(
  '/',
  upload.fields([
    { name: 'shopLogoImgPath', maxCount: 1 },
    { name: 'bannerImgPath', maxCount: 5 },
  ]),
  updateConfig
);

router.put('/banners/active/:id', updateActiveBanner);

router.delete('/founder/:id', deleteFounder);

router.delete('/banners/:id', deleteBanner);

router.delete('/core-value/:id', deleteCoreValue);

router.delete('/percent-filter/:id', deleteFilterPercent);

export default router;
