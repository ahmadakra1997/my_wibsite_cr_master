const express = require('express');
const { 
  getProducts, 
  getProductById, 
  createProduct, 
  updateProduct, 
  deleteProduct 
} = require('../controllers/productController');
const { auth, adminAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', auth, adminAuth, upload.single('image'), createProduct);
router.put('/:id', auth, adminAuth, updateProduct);
router.delete('/:id', auth, adminAuth, deleteProduct);

module.exports = router;
