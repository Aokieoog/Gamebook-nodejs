
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const apiRoutes = require('./src/routes/api');

const app = express();
const PORT = process.env.PORT;

// 连接 MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected!'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// 中间件
app.use(bodyParser.json());

// 路由
app.use('/api', apiRoutes);

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});