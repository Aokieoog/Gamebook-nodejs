// middlewares/cors.js
const cors = require('cors');

// 允许的域名列表
const allowedOrigins = ['https://jx.ieoog.com'];

// 封装的 CORS 中间件
const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, origin); // 允许请求
    } else {
      callback(new Error('Not allowed by CORS')); // 拒绝请求
    }
  },
  credentials: true, // 允许携带 cookie
});

module.exports = corsMiddleware;