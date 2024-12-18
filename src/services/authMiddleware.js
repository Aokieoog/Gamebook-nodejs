const jwt = require('jsonwebtoken');
const noAuthPaths = ['/api/users', '/api/login', '/api/forget-password'];

function authMiddleware(req, res, next) {
  // 检查是否是免验证路径
  if (noAuthPaths.some(path => req.path.startsWith(path))) {
    return next(); // 放行免验证路径
  }
  // 从 cookie 中获取 Token
  const token = req.cookies['access_tokenbook'];
  if (!token) {
    // 如果没有 Token，返回未授权
    return res.status(401).json({ error: '未授权: 未提供令牌' });
  }
  // 验证 Token
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: '未授权: 令牌无效' });
    }
    req.user = decoded; // 将解码后的用户数据存入 req
    next(); // 继续处理请求
  });
}

module.exports = authMiddleware;