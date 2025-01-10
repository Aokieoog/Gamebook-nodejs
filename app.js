
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const apiRoutes = require('./src/routes/api');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT;
const authMiddleware = require('./src/services/authMiddleware');
// const corsMiddleware = require('./src/services/cors');
const cookieParser = require('cookie-parser'); // 解析 cookie

// 配置 CORS
app.use(cors({
  origin: 'https://jx.ieoog.com', // 允许所有来源
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // 允许的请求方法
  allowedHeaders: ['Content-Type', 'Authorization'], // 允许的自定义头
  credentials: true, // 允许携带 Cookie
}));

app.use(cookieParser()); // 使用 cookie 中间件

// 连接 MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected!'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// 中间件
app.use(bodyParser.json());

// 路由
app.use(authMiddleware);
app.use('/api', apiRoutes);


// 启动服务器
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});