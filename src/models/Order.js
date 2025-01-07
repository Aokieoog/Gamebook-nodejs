const mongoose = require('mongoose');
const SoldOrder = require('./SoldOrder');

const orderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true }, // 单一物品 ID
  status: { type: String, default: 'pending' }, // 状态：pending | completed
  createdAt: { type: Date, default: Date.now },
  // 以下是物品相关的字段
  jin: { type: Number, default: 0 }, // 金币，默认值为 0
  yin: { type: Number, default: 0 }, // 银币，默认值为 0
  tong: { type: Number, default: 0 }, // 铜币，默认值为 0
  ress: { type: Number, required: true, default: 1 },
  stock: { type: Number, default: 0 }, // 库存，默认值为 0
  totalValue: { type: Number, default: 0 }, // 总价值，存储为字段
  orderTotalRevenue: { type: Number, default: 0 }, // 总售价，存储为字段
});

// 方法：自动计算并更新 totalValue
orderSchema.pre('save', async function (next) {
  if (!this.isNew) {
    return next(); // 如果是更新操作，跳过 totalValue 计算
  }
  // this.stock = this.ress;
  this.totalValue = (this.jin * 10000 + this.yin * 100 + this.tong) * this.ress;
  next();
});

// 方法：添加自动换算逻辑
orderSchema.methods.normalizeCurrency = function () {
  // 铜币转换为银币
  if (this.tong >= 100) {
    this.yin += Math.floor(this.tong / 100);
    this.tong %= 100;
  }

  // 银币转换为金币
  if (this.yin >= 100) {
    this.jin += Math.floor(this.yin / 100);
    this.yin %= 100;
  }
};


module.exports = mongoose.model('Order', orderSchema);