import jwt from 'jsonwebtoken';

const generateToken = (payload) => {
  const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: '1h',
  });

  const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: '7d',
  });

  return { accessToken, refreshToken };
};

export default generateToken;
