const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Items', required: true }, // 单一物品 ID
  item: { type: mongoose.Schema.Types.ObjectId, ref: 'Items', required: true }, // 单一物品 ID
  status: { type: String, default: 'pending' }, // 状态：pending | completed
  createdAt: { type: Date, default: Date.now },
  // 以下是物品相关的字段
  jin: { type: Number, default: 0 }, // 金币，默认值为 0
  yin: { type: Number, default: 0 }, // 银币，默认值为 0
  tong: { type: Number, default: 0 }, // 铜币，默认值为 0
  ress: { type: Number, required: true, default: 1 }, // 物品数量，必填字段，默认值为 1
  totalValue: { type: Number, default: 0 } // 总价值，存储为字段
});

// 方法：自动计算并更新 totalValue
orderSchema.pre('save', function (next) {
  // 计算总价值：1 金 = 10000 铜，1 银 = 100 铜
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


module.exports = mongoose.model('Orders', orderSchema);