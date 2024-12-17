const express = require('express');
const User = require('../models/User');
const Item = require('../models/Item');
const Order = require('../models/Order');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendMail } = require('../services/emailService'); // 引用邮件模块
const { Op } = require('sequelize');

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
        return res.status(409).json({ error: '登录账号已存在' });
      }
      if (existingUser.email === email) {
        return res.status(409).json({ error: '邮箱已存在' });
      }
    }
    // 创建新用户
    await User.create(req.body);
    res.status(201).json({ success: '用户创建成功' });
  } catch (err) {
    res.status(500).json({ error: '服务器错误，请稍后再试' });
  }
});

// 用户登录接口
router.post('/login', async (req, res) => {
  const { loginAccount, password } = req.body;
  try {
    // 查找用户
    const user = await User.findOne({ loginAccount });
    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }
    // 验证密码
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(402).json({ error: '密码错误' });
    }
    // 生成 JWT（可选）
    const token = jwt.sign(
      { userId: user._id, loginAccount: user.loginAccount },
      process.env.JWT_SECRET,
      { expiresIn: '72h' }
    );
    res.status(201).json({
      message: '登录成功',
      token, // 返回 token
      user: {
        uid: user._id,
        loginAccount: user.loginAccount,
        email: user.email
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//用户修改密码
router.post('/change-password', async (req, res) => {
  const { loginAccount, password, newPassword } = req.body;
  try {
    // 查找用户
    const user = await User.findOne({ loginAccount });
    if (!user) {
      return res.status(201).json({ error: '用户不存在' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(201).json({ error: '原密码错误' });
    }
    if (!newPassword) {
      return res.status(201).json({ error: '请输入新密码' });
    }
    if (newPassword == password) {
      return res.status(201).json({ error: '新密码与原密码一致' });
    }
    // 更新密码
    user.password = newPassword;
    await user.save();
    res.status(201).json({ success: '密码修改成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
})

// 找回密码
router.post('/forget-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
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
    res.status(201).json({ success: '邮件已发送' });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
      return res.status(201).json({ error: '无效的或已过期的令牌' });
    }
    // 更新密码
    user.password = newPassword; // 注意加密密码
    user.resetToken = undefined; // 清除令牌
    user.resetTokenExpiry = undefined;
    await user.save();
    res.status(201).json({ message: '密码已成功重置' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 物品模糊查询
router.get('/items', async (req, res) => {
  try {
    const { name } = req.query;
    // 参数校验
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Name parameter is required' });
    }
    // 模糊查询
    const items = await Item.find({
      name: { $regex: name, $options: 'i' },
    });
    res.status(200).json(items);
  } catch (err) {
    console.error(err); // 日志记录
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 创建订单
router.post('/orders', async (req, res) => {
  try {
    const { userId, itemId, jin, yin, tong, ress } = req.body;
    // 验证必填字段
    if (!userId) {
      return res.status(400).json({ error: 'userId 是必填字段' });
    }
    if (!itemId) {
      return res.status(400).json({ error: 'itemId 是必填字段' });
    }
    // 创建订单
    const newOrder = new Order({
      userId,
      itemId,
      jin: jin || 0,
      yin: yin || 0,
      tong: tong || 0,
      ress: ress || 1
    });
    const savedOrder = await newOrder.save();
    const populatedOrder = await Order.findById(savedOrder._id)
      .populate('itemId', 'name iconID'); // 填充 itemId，并指定只返回字段 name 和 price
    res.status(201).json({
      message: '订单添加成功',
      order: {
        orderid: savedOrder._id,
        jin: savedOrder.jin,
        yin: savedOrder.yin,
        tong: savedOrder.tong,
        ress: savedOrder.ress,
        totalValue:savedOrder.totalValue,
        createdAt: savedOrder.createdAt,
        item: populatedOrder.itemId // 返回填充后的 item 数据
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 查询订单（包含用户和物品详情）
router.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('userId', 'loginAccount email')
      .populate('itemId', 'itemName');
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;