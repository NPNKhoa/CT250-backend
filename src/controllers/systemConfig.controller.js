import {
  Banner,
  CoreValue,
  Founder,
  PercentFilter,
  PriceFilter,
  SystemConfig,
} from '../models/systemConfig.model.js';
import logError from '../utils/logError.js';
import { isValidObjectId } from '../utils/isValidObjectId.js';

export const createConfig = async (req, res) => {
  try {
    const { shopName, shopEmail, shopPhoneNumber, shopIntroduction } = req.body;

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
      shopIntroduction,
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
    })
      .populate('shopPriceFilter')
      .populate('shopPercentFilter')
      .populate('coreValue')
      .populate('founders');

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
    const { shopName, shopEmail, shopPhoneNumber, shopIntroduction } = req.body;

    const shopLogoImgPath = req?.files?.shopLogoImgPath?.[0]?.path;

    let bannerImgPath;

    const prevConfig = await SystemConfig.findOne({
      isChoose: true,
    });

    if (req?.files?.bannerImgPath) {
      bannerImgPath = req?.files?.bannerImgPath?.map((file) => file.path);
    } else if (
      Array.isArray(req.body.bannerImgPath) &&
      req.body.bannerImgPath.length !== 0
    ) {
      bannerImgPath = req.body.bannerImgPath;
    } else {
      bannerImgPath = prevConfig.bannerImgPath;
    }

    const currentPriceFilters = await PriceFilter.find();

    let shopPriceFilter =
      Array.isArray(currentPriceFilters) &&
      currentPriceFilters.map((filter) => filter._id);

    if (Array.isArray(shopPriceFilter) && shopPriceFilter.length === 0) {
      shopPriceFilter = prevConfig.shopPriceFilter;
    }

    const newConfig = await SystemConfig.create({
      shopName: shopName || prevConfig.shopName,
      shopEmail: shopEmail || prevConfig.shopEmail,
      shopPhoneNumber: shopPhoneNumber || prevConfig.shopPhoneNumber,
      shopLogoImgPath: shopLogoImgPath || prevConfig.shopLogoImgPath,
      bannerImgPath: bannerImgPath || prevConfig.bannerImgPath,
      shopIntroduction: shopIntroduction || prevConfig.shopIntroduction,
      shopPriceFilter,
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

export const addFilterPercent = async (req, res) => {
  try {
    const { fromValue, toValue } = req.body;

    if (!isNaN(fromValue) && (fromValue < 0 || fromValue > 100)) {
      return res.status(400).json({
        error: 'From value must be a number between 0 and 100',
      });
    }

    if (!isNaN(toValue)) {
      if (toValue < 0 || toValue > 100) {
        return res.status(400).json({
          error: 'To value must be a number between 0 and 100',
        });
      }

      if (toValue < fromValue) {
        return res.status(400).json({
          error: 'To value must be greater than from value',
        });
      }
    }

    const newPercentFilter = await PercentFilter.create({
      fromValue,
      toValue,
    });

    res.status(201).json({
      data: newPercentFilter,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const deleteFilterPercent = async (req, res) => {
  try {
    const { id } = req.params;

    if (id && !isValidObjectId(id)) {
      return res.status(400).json({
        error: 'Invalid id',
      });
    }

    const deletedFilter = await PercentFilter.findByIdAndDelete(id);

    if (!deletedFilter) {
      return res.status(404).json({
        error: 'Not found',
      });
    }

    res.sendStatus(204);
  } catch (error) {
    logError(error, res);
  }
};

export const getFilterPercent = async (_, res) => {
  try {
    const filterPercent = await PercentFilter.find();

    if (Array.isArray(filterPercent) && filterPercent.length === 0) {
      return res.status(404).json({
        error: 'Not found',
      });
    }

    res.status(200).json({
      data: filterPercent,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const addBanner = async (req, res) => {
  try {
    const bannerImgPath = req?.file?.path;
    const { isActiveBanner } = req.body;

    if (!bannerImgPath) {
      return res.status(400).json({
        error: 'Missing file',
      });
    }

    const newBanner = await Banner.create({
      bannerImgPath,
      isActiveBanner:
        typeof isActiveBanner === 'boolean' ? isActiveBanner : false,
    });

    const currentConfig = await SystemConfig.findOne({ isChoose: true });

    if (!currentConfig) {
      return res.status(404).json({
        error: 'Not found',
      });
    }

    newBanner.isActiveBanner && currentConfig.bannerImgPath.push(newBanner._id);

    await currentConfig.save();

    res.status(201).json({
      data: newBanner,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const updateActiveBanner = async (req, res) => {
  try {
    const { id } = req.params;

    if (id && !isValidObjectId(id)) {
      return res.status(400).json({
        error: 'INvalid id',
      });
    }

    const existingBanner = await Banner.findById(id);

    if (!existingBanner) {
      return res.status(404).json({
        error: 'Not found banner',
      });
    }

    existingBanner.isActiveBanner = true;

    const currentConfig = await SystemConfig.findOne({ isChoose: true });

    if (!currentConfig) {
      return res.status(404).json({
        error: 'Not found',
      });
    }

    currentConfig.bannerImgPath.push(existingBanner._id);

    await Promise.all([existingBanner.save(), currentConfig.save()]);

    res.status(200).json({
      data: currentConfig.bannerImgPath,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const getAllBanners = async (_, res) => {
  try {
    const banners = await Banner.find();

    if (Array.isArray(banners) && banners.length === 0) {
      return res.status(404).json({
        error: 'Not found banners',
      });
    }

    return res.status(200).json({
      data: banners,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const getActiveBanners = async (_, res) => {
  try {
    const activeBanners = await Banner.find({ isActiveBanner: true });

    if (Array.isArray(activeBanners) && activeBanners.length === 0) {
      return res.status(404).json({
        error: 'Not found active banners',
      });
    }

    res.status(200).json({
      data: activeBanners,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;

    if (id && !isValidObjectId(id)) {
      return res.status(400).json({
        error: 'Invalid id',
      });
    }

    const deletedBanner = await Banner.findByIdAndDelete(id);

    if (!deletedBanner) {
      return res.status(404).json({
        error: 'Not found',
      });
    }

    const currentConfig = await SystemConfig.findOne({ isChoose: true });

    if (!currentConfig) {
      return res.status(404).json({
        error: 'Not found',
      });
    }

    const deletedIndex = currentConfig.bannerImgPath.findIndex((item) =>
      item._id.equals(deletedBanner._id)
    );

    if (deletedIndex === -1) {
      return res.status(400).json({
        error: 'Banner not found in system config',
      });
    }

    currentConfig.bannerImgPath.splice(deletedIndex, 1);

    await currentConfig.save();

    res.sendStatus(204);
  } catch (error) {
    logError(error, res);
  }
};

export const addCoreValue = async (req, res) => {
  try {
    const { title, content } = req.body;

    const newCoreValue = await CoreValue.create({ title, content });

    const currentConfig = await SystemConfig.findOne({ isChoose: true });

    if (!currentConfig) {
      return res.sendStatus(400);
    }

    currentConfig.coreValue.push(newCoreValue._id);

    await currentConfig.save();

    res.status(201).json({
      data: newCoreValue,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const deleteCoreValue = async (req, res) => {
  try {
    const { id } = req.params;

    if (id && !isValidObjectId(id)) {
      return res.status(400).json({
        error: 'Invalid id',
      });
    }

    const deletedCoreValue = await CoreValue.findByIdAndDelete(id);

    if (!deletedCoreValue) {
      return res.status(404).json({
        error: 'Not found',
      });
    }

    res.sendStatus(204);
  } catch (error) {
    logError(error, res);
  }
};

export const getCoreValue = async (_, res) => {
  try {
    const coreValues = await CoreValue.find();

    if (Array.isArray(coreValues) && coreValues.length === 0) {
      return res.status(404).json({
        error: 'Not found',
      });
    }

    res.status(200).json({
      data: coreValues,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const addFounder = async (req, res) => {
  try {
    const { founderName } = req.body;

    const founderAvatarPath = req?.file?.path;

    const newFounder = await Founder.create({
      founderName,
      founderAvatarPath,
    });

    const currentConfig = await SystemConfig.findOne({ isChoose: true });

    if (!currentConfig) {
      return res.sendStatus(400);
    }

    currentConfig.founders.push(newFounder._id);

    await currentConfig.save();

    res.status(201).json({
      data: newFounder,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};

export const deleteFounder = async (req, res) => {
  try {
    const { id } = req.params;

    if (id && !isValidObjectId(id)) {
      return res.status(400).json({
        error: 'Invalid id',
      });
    }

    const deletedFounder = await Founder.findByIdAndDelete(id);

    if (!deletedFounder) {
      return res.status(404).json({
        error: 'Not found',
      });
    }

    res.sendStatus(204);
  } catch (error) {
    logError(error, res);
  }
};

export const getFounder = async (_, res) => {
  try {
    const founders = await Founder.find();

    if (Array.isArray(founders) && founders.length === 0) {
      return res.status(404).json({
        error: 'Not found',
      });
    }

    res.status(200).json({
      data: founders,
      error: false,
    });
  } catch (error) {
    logError(error, res);
  }
};
