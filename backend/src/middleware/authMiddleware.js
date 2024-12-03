const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyToken } = require('../utils/jwt');

// 保护路由中间件
const protect = async (req, res, next) => {
  let token;

  // 检查授权头
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // 获取token
      token = req.headers.authorization.split(' ')[1];

      // 验证token
      const decoded = verifyToken(token);

      if (!decoded) {
        return res.status(401).json({ message: '未授权，token无效' });
      }

      // 查找用户并附加到请求对象
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: '未找到用户' });
      }

      next();
    } catch (error) {
      res.status(401).json({ message: '未授权，token验证失败', error: error.message });
    }
  }

  if (!token) {
    res.status(401).json({ message: '未授权，没有token' });
  }
};

// 管理员权限中间件
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: '需要管理员权限' });
  }
};

module.exports = { protect, admin };
