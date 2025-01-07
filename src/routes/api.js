const express = require('express');
const router = express.Router();
const { sendMail } = require('../services/emailService'); // 引用邮件模块
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Item = require('../models/Item');
const Order = require('../models/Order');
const SoldOrder = require('../models/SoldOrder');

// 创建用户
router.post('/users', async (req, res) => {
  try {
    const { loginAccount, email } = req.body;
    // 合并查询
    const existingUser = await User.findOne({
      $or: [{ loginAccount }, { email }]
    });

    if (existingUser) {
      if (existingUser.loginAccount === loginAccount) {
        return res.status(200).json({ 
          code: 401,
          message: '登录账号已存在' });
      }
      if (existingUser.email === email) {
        return res.status(200).json({ 
          code: 402,
          message: '邮箱已存在' });
      }
    }
    // 创建新用户
    await User.create(req.body);
    res.status(200).json({ 
      code: 200,
      message: '用户创建成功' });
  } catch (err) {
    res.status(200).json({ 
      code: 500,
      message: '服务器错误，请稍后再试' });
  }
});

// 用户登录接口
router.post('/login', async (req, res) => {
  const { loginAccount, password } = req.body;
  try {
    // 查找用户
    const user = await User.findOne({ loginAccount });
    if (!user) {
      return res.status(200).json({ 
        code: 401,
        message: '用户不存在' });
    }
    // 验证密码
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(200).json({ 
        code: 402,
        message: '密码错误' });
    }
    // 生成 JWT（可选）
    const token = jwt.sign(
      { userId: user._id, loginAccount: user.loginAccount },
      process.env.JWT_SECRET,
      { expiresIn: '72h' }
    );
    res.status(200).json({
      code: 200,
      message: '登录成功',
      token, // 返回 token
      user: {
        uid: user._id,
        loginAccount: user.loginAccount,
        email: user.email
      }
    });
  } catch (err) {
    res.status(200).json({ 
      code: 500,
      message: err.message });
  }
});

//用户修改密码
router.post('/change-password', async (req, res) => {
  const { loginAccount, password, newPassword } = req.body;
  try {
    // 查找用户
    const user = await User.findOne({ loginAccount });
    if (!user) {
      return res.status(200).json({ 
        code: 401,
        message: '用户不存在' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(200).json({ 
        code: 402,
        message: '原密码错误' });
    }
    if (!newPassword) {
      return res.status(200).json({ 
        code: 403,
        message: '请输入新密码' });
    }
    if (newPassword == password) {
      return res.status(200).json({ 
        code: 404,
        message: '新密码与原密码一致' });
    }
    // 更新密码
    user.password = newPassword;
    await user.save();
    res.status(200).json({ 
      code: 200,
      message: '密码修改成功' });
  } catch (err) {
    res.status(200).json({ 
      code: 500,
      message: err.message });
  }
})

// 找回密码
router.post('/forget-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({ 
        code: 401,
        message: '用户不存在' });
    }
    const resetToken = crypto.randomBytes(32).toString('hex'); // 这里生成实际的重置令牌
    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;
    // 保存重置令牌到数据库
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 3600000; // 1小时过期
    await user.save();
    // 更新密码
    // 发送重置密码邮件
    await sendMail(
      email,
      '密码重置请求',
      `请点击以下链接重置您的密码：\n
      一小时后过期：\n
      ${resetUrl}`
    );
    res.status(200).json({ 
      code: 200,
      message: '邮件已发送' });
  } catch (err) {
    res.status(200).json({ 
      code: 500,
      message: err.message });
  }
})

// 找回密码验证
router.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    // 查找与该令牌匹配的用户
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() } // 检查令牌是否过期
    });
    if (!user) {
      return res.status(200).json({ 
        code: 401,
        message: '无效的或已过期的令牌' });
    }
    // 更新密码
    user.password = newPassword; // 注意加密密码
    user.resetToken = undefined; // 清除令牌
    user.resetTokenExpiry = undefined;
    await user.save();
    res.status(200).json({ 
      code: 200,
      message: '密码已成功重置' });
  } catch (error) {
    res.status(200).json({ 
      code: 500,
      message: error.message });
  }
});

// 物品模糊查询
router.get('/items', async (req, res) => {
  try {
    const { name } = req.query;
    // 参数校验
    if (!name || name.trim() === '') {
      return res.status(200).json({ 
        code:400,
        items: 'Name parameter is required' });
    }
    // 模糊查询
    const items = await Item.find({
      name: { $regex: name, $options: 'i' },
    });
    res.status(200).json(items);
  } catch (err) {
    console.error(err); // 日志记录
    res.status(200).json({ 
      code: 500,
      message: 'Internal server error' });
  }
});

// 创建订单
router.post('/orders', async (req, res) => {
  try {
    const { userId, itemId, jin, yin, tong, quantity } = req.body;
    // 验证必填字段
    if (!userId) {
      return res.status(200).json({ 
        code: 400,
        message: 'userId 是必填字段' });
    }
    if (!itemId) {
      return res.status(200).json({ 
        code: 400,
        message: 'itemId 是必填字段' });
    }
    // 创建订单
    const newOrder = new Order({
      userId,
      itemId,
      jin: jin || 0,
      yin: yin || 0,
      tong: tong || 0,
      ress: quantity || 1,
      stock: quantity
    });
    const savedOrder = await newOrder.save();
    const populatedOrder = await Order.findById(savedOrder._id)
      .populate('itemId', 'name iconID'); // 填充 itemId，并指定只返回字段 name 和 price
    res.status(200).json({
      code: 200,
      message: '订单添加成功',
      order: {
        orderid: savedOrder._id,
        jin: savedOrder.jin,
        yin: savedOrder.yin,
        tong: savedOrder.tong,
        ress: savedOrder.ress,
        totalValue: savedOrder.totalValue,
        createdAt: savedOrder.createdAt,
        item: populatedOrder.itemId, // 返回填充后的 item 数据
        stock: savedOrder.stock,
        orderTotalRevenue: savedOrder.orderTotalRevenue
      }
    });
  } catch (err) {
    res.status(200).json({ 
      code: 500,
      message: err.message });
  }
});

// 查询订单（包含用户和物品详情）
router.get('/orderInquiry', async (req, res) => {
  const { userId } = req.query;
  try {
    const orders = await Order.find({ userId })
      .select('-__v')
      .populate('itemId', 'name iconID -_id');

    const formattedOrders = orders.map(order => {
      const item = order.itemId || {}; // 如果 itemId 为 null，则使用空对象
      return {
        orderId: order._id,
        userId: order.userId,
        name: item.name || '未知物品', // 如果 name 为 undefined，则使用默认值
        iconID: item.iconID || '未知图标', // 如果 iconID 为 undefined，则使用默认值
        status: order.status,
        jin: order.jin,
        yin: order.yin,
        tong: order.tong,
        ress: order.ress,
        stock: order.stock,
        totalValue: order.totalValue,
        createdAt: order.createdAt,
        orderTotalRevenue: order.orderTotalRevenue
      };
    });

    res.status(200).json(formattedOrders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 删除订单
router.delete('/delorders', async (req, res) => {
  const { id } = req.query;
  // 参数验证
  if (!id) {
    return res.status(400).json({ error: '订单未找到' });
  }
  try {
    // 数据库删除操作
    const result = await Order.findByIdAndDelete(id);
    if (!result) {
      return res.status(404).json({ error: '订单未找到' });
    }
    res.status(204).send(); // 删除成功响应
  } catch (err) {
    console.error('Error:', err);  // 捕获错误并输出
    res.status(500).json({ error: err.message });
  }
});

// 出售订单的接口
router.post('/order/sell', async (req, res) => {
  // 价格计算函数
  const calculatePrice = (jin, yin, tong) => {
    return (+jin * 10000) + (+yin * 100) + (+tong);
  };
  try {
    const { orderId, sellPrice } = req.body;
    const order = await Order.findById(orderId);
    // 创建新的 SoldOrder 实例
    const price = calculatePrice(sellPrice.jin, sellPrice.yin, sellPrice.tong); // 价格转换
    const data = new SoldOrder({
      orderId: orderId, // 根据需求提取商品信息
      quantity: sellPrice.quantity,
      price: price
    });
    // 比较 quantity 和 stock 数量
    if (sellPrice.quantity > order.stock) {
      return res.status(200).json({ code: '400', message: '出售数量大于库存数量' });
    }
    order.stock -= sellPrice.quantity;
    // 保存到数据库
    await order.save();
    await data.save();
    // 返回响应，包括 totalRevenue 和 formattedDateSold
    res.status(200).json({
      message: '订单成功售出',
      code: 200,
      data: data.toJSON()  // 使用 toJSON() 确保正确的格式
    });
  } catch (err) {
    console.error('处理订单时出错:', err);
    res.status(500).json({ message: '处理订单时出错', error: err.message });
  }
});

// 查询已售订单
router.get('/order/query', async (req, res) => {
  const { orderId } = req.query;
  try {
    if (!orderId) {
      return res.status(400).json({ message: '订单 ID 不能为空' });
    }
    const soldOrders = await SoldOrder.find({ orderId: orderId })

    res.status(200).json(soldOrders);
  } catch (err) {
    console.error('查询已售订单时出错:', err);
    res.status(500).json({ message: '查询已售订单时出错', error: err.message });
  }
});

router.delete('/order/delete', async (req, res) => {
  try {
    const { id, stock } = req.query;

    // 检查是否提供了订单 ID
    if (!id) {
      return res.status(400).json({ message: '订单 ID 不能为空' });
    }
    // 删除订单
    const result = await SoldOrder.findOneAndDelete({ _id: id });
    // 如果找不到订单
    if (!result) {
      return res.status(404).json({ error: '订单未找到' });
    }
    // 如果传入了 stock 参数，更新对应库存
    if (stock && !isNaN(stock)) {
      const stockValue = parseInt(stock, 10); // 转换为整数
      const order = await Order.findOne({ _id: result.orderId }); // 根据已售订单的 orderId 找到对应订单
      if (order) {
        order.stock += stockValue; // 增加库存
        await order.save(); // 保存更改
      } else {
        console.error(`未找到对应的订单，订单 ID: ${result.orderId}`);
      }
    }
    // 返回成功消息
    res.status(200).json({ message: '已售订单删除成功' });
  } catch (err) {
    res.status(500).json({ error: '服务器内部错误，请稍后重试' });
  }
});

// 添加售出总和
router.post('/addOrderTotal', async (req, res) => {
  try {
    const { orderId, orderTotalRevenue } = req.body;
    // 查找订单实例
    // 使用 findById 查找订单
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    // 更新 orderTotalRevenue 字段
    order.orderTotalRevenue = orderTotalRevenue;
    await order.save();
    res.status(200).json({
      message: 'Order total revenue updated successfully',
      order,
    });
  } catch (error) {
    console.error('Error updating order total revenue:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message,
    });
  }
})

module.exports = router;