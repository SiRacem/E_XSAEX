const express = require('express');
const { getCart, addToCart, removeFromCart, clearCart, incrementProductQuantity, decrementProductQuantity } = require('../controllers/cart.controller');
const { verifyAuth } = require('../middlewares/verifyAuth');

const router = express.Router();

router.get('/', verifyAuth, getCart);
router.post('/add', verifyAuth, addToCart);
router.put('/increment/:productId', verifyAuth, incrementProductQuantity);
router.put('/decrement/:productId', verifyAuth, decrementProductQuantity);
router.delete('/remove/:productId', verifyAuth, removeFromCart);
router.delete('/clear', verifyAuth, clearCart);

module.exports = router;