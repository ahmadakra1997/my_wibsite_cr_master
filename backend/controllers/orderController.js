const Order = require('../models/Order');
const Cart = require('../models/Cart');

// إنشاء طلب جديد
exports.createOrder = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
    
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'عربة التسوق فارغة' });
    }

    const orderItems = cart.items.map(item => ({
      name: item.product.name,
      quantity: item.quantity,
      price: item.product.price,
      product: item.product._id
    }));

    const totalPrice = orderItems.reduce((total, item) => total + (item.price * item.quantity), 0);

    const order = new Order({
      user: req.user.id,
      orderItems,
      totalPrice
    });

    await order.save();
    
    // تفريغ عربة التسوق بعد إنشاء الطلب
    cart.items = [];
    await cart.save();

    res.status(201).json({ message: 'تم إنشاء الطلب بنجاح', order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
};

// الحصول على طلبات المستخدم
exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate('orderItems.product');

    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
};

// الحصول على جميع الطلبات (للمسؤول)
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate('user', 'name email')
      .populate('orderItems.product');

    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
};

// تحديث حالة الطلب (للمسؤول)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'حالة الطلب غير صالحة' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('user', 'name email').populate('orderItems.product');

    if (!order) {
      return res.status(404).json({ message: 'الطلب غير موجود' });
    }

    res.json({ message: 'تم تحديث حالة الطلب بنجاح', order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'خطأ في الخادم' });
  }
};
