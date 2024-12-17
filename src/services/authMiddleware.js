const jwt = require('jsonwebtoken'); // 用于解析和验证 JWT

const noAuthPaths = ['/api/users', '/api/login', '/api/forget-password'];

function authMiddleware(req, res, next) {
  // 检查请求路径是否在免验证列表中
  if (noAuthPaths.some(path => req.path.startsWith(path))) {
    return next(); // 如果是免验证路径，直接放行
  }

  // 从请求头获取 token
  const authHeader = req.headers['authorization'];
  const token = typeof authHeader === 'string' ? authHeader.split(' ')[1] : null;
  if (!token) {
    console.error('Token not provided');
    return res.status(401).json({ error: '未授权: 未提供令牌' });
  }
  // 验证 token
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error('Invalid token:', err.message);
      return res.status(401).json({ error: '未授权: 令牌无效' });
    }
    // 如果 token 有效，将解码后的数据挂载到请求对象
    req.user = decoded;
    console.log('Token verified, user:', req.user);
    next(); // 继续处理请求
  });
}

module.exports = authMiddleware;