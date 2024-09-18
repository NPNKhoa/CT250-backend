import express from 'express';
import {
  addToCart,
  changeItemQuantity,
  createCartDetail,
  deleteAllFromCart,
  deleteFromCart,
  getCartByUser,
  selectItem,
} from '../controllers/cart.controller.js';
import { auth } from '../middlewares/authentication.js';

const router = express.Router();

router.get('/', auth, getCartByUser);

router.post('/add', auth, addToCart);

router.post('/add-detail', auth, createCartDetail);

router.put('/update-quantity', auth, changeItemQuantity);

router.put('/select', auth, selectItem);

router.delete('/all', auth, deleteAllFromCart);

router.delete('/:id', auth, deleteFromCart);

export default router;
