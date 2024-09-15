import express from 'express';
import dotenv from 'dotenv';
import logger from 'morgan';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';

import { connectDb } from './configs/dbConnection.js';
import passport from './configs/passportConfig.js';
import './configs/passportConfig.js';

import authRoute from './routes/auth.route.js';
import productRoute from './routes/product.route.js';
import brandRoute from './routes/brand.route.js';
import productTypeRoute from './routes/productType.route.js';
import promotionRoute from './routes/promotion.route.js';
import discountRoute from './routes/discount.route.js';
import specificationRoute from './routes/specification.route.js';
import userRoute from './routes/user.route.js';
import cartRoute from './routes/cart.route.js';
import addressRoute from './routes/address.route.js';
import orderRoute from './routes/order.route.js';
import paymentMethodRoute from './routes/paymentMethod.route.js';
import orderStatusRoute from './routes/orderStatus.route.js';
import shippingMethodRoute from './routes/shippingMethod.route.js';
import feedBackRoutes from './routes/feedback.route.js';

dotenv.config({ path: `${process.cwd()}/.env` });

connectDb();

const app = express();
const port = process.env.PORT || 3001;
const apiVersion = process.env.API_VERSION || 'v1';
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(express.json());
app.use(logger('dev'));

app.use('/uploads', express.static(path.join(path.dirname(''), 'uploads')));

app.get('/check', (_, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
  });
});

app.use(`/api/${apiVersion}/auth`, authRoute);
app.use(`/api/${apiVersion}/products`, productRoute);
app.use(`/api/${apiVersion}/brands`, brandRoute);
app.use(`/api/${apiVersion}/product-types`, productTypeRoute);
app.use(`/api/${apiVersion}/promotion`, promotionRoute);
app.use(`/api/${apiVersion}/discount`, discountRoute);
app.use(`/api/${apiVersion}/specification`, specificationRoute);
app.use(`/api/${apiVersion}/users`, userRoute);
app.use(`/api/${apiVersion}/cart`, cartRoute);
app.use(`/api/${apiVersion}/address`, addressRoute);
app.use(`/api/${apiVersion}/payment-methods`, paymentMethodRoute);
app.use(`/api/${apiVersion}/order-status`, orderStatusRoute);
app.use(`/api/${apiVersion}/order`, orderRoute);
app.use(`/api/${apiVersion}/shipping-method`, shippingMethodRoute);
app.use(`/api/${apiVersion}/feedback`, feedBackRoutes);
app.get(
  '/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);
app.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/login');
  }
);

app.use('*', (_, res) => {
  res.status(404).json({
    error: 'Oops... Can not found this route!!!',
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
});
