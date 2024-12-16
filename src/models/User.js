const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  loginAccount: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  resetToken: { type: String }, // 用于存储重置令牌
  resetTokenExpiry: { type: Date }, // 用于存储重置令牌的过期时间
});

// 保存用户之前加密密码
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// 验证密码
UserSchema.methods.comparePassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);