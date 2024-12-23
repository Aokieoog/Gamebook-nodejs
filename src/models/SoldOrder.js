const mongoose = require('mongoose');

const soldOrderSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Orders', required: true },
  quantity: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  dateSold: {
    type: Date,
    default: Date.now
  },
  totalRevenue: {
    type: Number,
    default: 0
  },
});

// 自动计算 totalRevenue
soldOrderSchema.pre('save', async function (next) {
  this.totalRevenue = this.quantity * this.price;
});

// 定制化返回 JSON 数据
soldOrderSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret.__v;
    delete ret._id;  // 删除 _id 字段
    return ret;
  }
})

module.exports = mongoose.model('SoldOrder', soldOrderSchema);