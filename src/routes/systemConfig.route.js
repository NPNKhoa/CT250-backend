import express from 'express';

import upload from '../configs/multerConfig.js';
import {
  backupConfig,
  createConfig,
  getCurrentConfig,
  updateConfig,
} from '../controllers/systemConfig.controller.js';

const router = express.Router();

router.get('/current', getCurrentConfig);

router.post(
  '/',
  upload.fields([
    { name: 'shopLogoImgPath', maxCount: 1 },
    { name: 'bannerImgPath', maxCount: 5 },
  ]),
  createConfig
);

router.post('/backup', backupConfig);

router.put(
  '/',
  upload.fields([
    { name: 'shopLogoImgPath', maxCount: 1 },
    { name: 'bannerImgPath', maxCount: 5 },
  ]),
  updateConfig
);

export default router;
