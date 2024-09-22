import logError from '../utils/logError';

export const createConfig = async (req, res) => {
  try {
    const {
      shopName,
      shopLogoImgPath,
      bannerImgPath,
      shopEmail,
      shopPhoneNumber,
      shopPriceFilter,
    } = req.body;
  } catch (error) {
    logError(error, res);
  }
};
