import express from 'express';
import {
  addToCart,
  changeItemQuantity,
  deleteAllFromCart,
  deleteFromCart,
  getCartByUser,
  selectItem,
} from '../controllers/cart.controller.js';
import { auth } from '../middlewares/authentication.js';

const router = express.Router();

router.get('/', auth, getCartByUser);

router.post('/add', auth, addToCart);

router.put('/update-quantity', auth, changeItemQuantity);

router.put('/select', auth, selectItem);

router.delete('/all', auth, deleteAllFromCart);

router.delete('/:id', auth, deleteFromCart);

export default router;
