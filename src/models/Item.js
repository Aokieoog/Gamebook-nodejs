const mongoose = require('mongoose');
// 定义 ItemSchema
const ItemSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // 名称字段
  uid: { type: String, required: true, unique: true },   // ID 字段
  iconID: { type: String, required: true},   // ID 字段
});
// 导出时使用正确的模型名称 Icon
module.exports = mongoose.model('Items', ItemSchema);