
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

app.use(cors());
// app.use(corsMiddleware); // 使用 CORS 中间件

app.use(cookieParser()); // 使用 cookie 中间件

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // 允许所有域名
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE'); // 允许的 HTTP 方法
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // 允许的自定义头
  next();
});
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
app.listen(PORT,'0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});