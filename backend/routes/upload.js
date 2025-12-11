const express = require('express');
const upload = require('../middleware/upload');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.post('/', auth, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'لم يتم تحميل أي صورة' });
  }
  
  res.json({
    message: 'تم رفع الصورة بنجاح',
    imageUrl: `/uploads/${req.file.filename}`
  });
});

module.exports = router;
