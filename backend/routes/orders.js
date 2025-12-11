const express = require('express');
const { 
  createOrder, 
  getUserOrders, 
  getAllOrders, 
  updateOrderStatus 
} = require('../controllers/orderController');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/', auth, createOrder);
router.get('/my-orders', auth, getUserOrders);
router.get('/', auth, adminAuth, getAllOrders);
router.put('/:id/status', auth, adminAuth, updateOrderStatus);

module.exports = router;
