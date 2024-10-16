import express from 'express';

import upload from '../configs/multerConfig.js';
import {
  addCoreValue,
  addFilterPercent,
  addFounder,
  backupConfig,
  createConfig,
  deleteCoreValue,
  deleteFilterPercent,
  deleteFounder,
  getCoreValue,
  getCurrentConfig,
  getFilterPercent,
  getFounder,
  updateConfig,
} from '../controllers/systemConfig.controller.js';

const router = express.Router();

router.get('/current', getCurrentConfig);

router.get('/founder', getFounder);

router.get('/core-value', getCoreValue);

router.get('/percent-filter', getFilterPercent);

router.post(
  '/',
  upload.fields([
    { name: 'shopLogoImgPath', maxCount: 1 },
    { name: 'bannerImgPath', maxCount: 5 },
  ]),
  createConfig
);

router.post('/core-value', addCoreValue);

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

router.delete('/founder/:id', deleteFounder);

router.delete('/core-value/:id', deleteCoreValue);

router.delete('/percent-filter/:id', deleteFilterPercent);

export default router;
