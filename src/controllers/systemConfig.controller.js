import { SystemConfig } from '../models/systemConfig.model.js';
import logError from '../utils/logError.js';

export const createConfig = async (req, res) => {
  try {
    const { shopName, shopEmail, shopPhoneNumber } = req.body;

    const shopLogoImgPath = req?.files?.shopLogoImgPath?.[0]?.path;

    const bannerImgPath = req?.files?.bannerImgPath?.map((file) => file.path);

    if (
      !shopName ||
      !shopLogoImgPath ||
      (Array.isArray(bannerImgPath) && bannerImgPath.length === 0) ||
      !shopEmail ||
      !shopPhoneNumber
    ) {
      return res.status(400).json({
        error: 'Missing required field',
      });
    }

    const newConfig = await SystemConfig.create({
      shopName,
      shopEmail,
      shopPhoneNumber,
      shopLogoImgPath,
      bannerImgPath,
      isChoose: true,
    });

    res.status(200).json({
      data: newConfig,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const getCurrentConfig = async (_, res) => {
  try {
    const systemConfig = await SystemConfig.findOne({
      isChoose: true,
    }).populate('shopPriceFilter');

    if (!systemConfig) {
      return res.status(404).json({
        error: 'Can not found config',
      });
    }

    res.status(200).json({
      data: systemConfig,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const updateConfig = async (req, res) => {
  try {
    const { shopName, shopEmail, shopPhoneNumber } = req.body;

    const shopLogoImgPath = req?.files?.shopLogoImgPath?.[0]?.path;

    const bannerImgPath = req?.files?.bannerImgPath?.map((file) => file.path);

    const prevConfig = await SystemConfig.findOne({
      isChoose: true,
    });

    console.log(req.body);

    const newConfig = await SystemConfig.create({
      shopName: shopName || prevConfig.shopName,
      shopEmail: shopEmail || prevConfig.shopEmail,
      shopPhoneNumber: shopPhoneNumber || prevConfig.shopPhoneNumber,
      shopLogoImgPath: shopLogoImgPath || prevConfig.shopLogoImgPath,
      bannerImgPath: bannerImgPath || prevConfig.bannerImgPath,
      isChoose: true,
    });

    prevConfig.isChoose = false;
    await prevConfig.save();

    res.status(200).json({
      data: newConfig,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const backupConfig = async (_, res) => {
  try {
    const allConfigs = await SystemConfig.find();

    if (Array.isArray(allConfigs) && allConfigs.length === 0) {
      return res.status(404).json({
        error: 'Not found configs',
      });
    }

    if (allConfigs.length < 2) {
      return res.status(404).json({
        error: 'No more config for backup',
      });
    }

    const deletedConfig = allConfigs.find((config) => config.isChoose === true);

    const applyConfig = await SystemConfig.findOne({ isChoose: false }).sort({
      createdAt: -1,
    });

    if (!applyConfig) {
      return res.status(404).json({
        error: 'No available config to apply',
      });
    }

    await Promise.all([
      SystemConfig.findByIdAndDelete(deletedConfig?._id),
      SystemConfig.findByIdAndUpdate(applyConfig?._id, { isChoose: true }),
    ]);

    const responseConfig = await SystemConfig.findOne({ isChoose: true });

    return res.status(200).json({
      data: responseConfig,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};
