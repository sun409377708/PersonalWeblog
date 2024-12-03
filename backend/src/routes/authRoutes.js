const express = require('express');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { protect } = require('../middleware/authMiddleware');
const { sendEmail } = require('../utils/email');

const router = express.Router();

// RESTful 响应工具函数
const sendResponse = (res, statusCode, data, message = '') => {
  return res.status(statusCode).json({
    code: statusCode,
    message: message,
    data: data || null
  });
};

// 用户注册 - 创建新资源 (POST)
router.post('/', 
  [
    body('username').trim().isLength({ min: 3, max: 20 }).withMessage('用户名长度必须在3-20个字符之间'),
    body('email').isEmail().withMessage('请提供有效的邮箱地址'),
    body('password').isLength({ min: 6 }).withMessage('密码至少6个字符')
  ],
  async (req, res) => {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, { errors: errors.array() }, '参数验证失败');
    }

    const { username, email, password } = req.body;

    try {
      // 检查用户是否已存在
      let existingUser = await User.findOne({ $or: [{ email }, { username }] });
      if (existingUser) {
        return sendResponse(res, 409, null, '用户名或邮箱已被注册');
      }

      // 创建新用户
      const user = await User.create({
        username,
        email,
        password
      });

      // 生成token
      const token = generateToken(user._id);

      // RESTful响应
      sendResponse(res, 201, {
        userId: user._id,
        username: user.username,
        email: user.email,
        token: token
      }, '用户注册成功');

    } catch (error) {
      sendResponse(res, 500, null, '服务器错误：' + error.message);
    }
  }
);

// 用户登录 - 认证资源 (POST)
router.post('/login', 
  [
    body('email').isEmail().withMessage('请提供有效的邮箱地址'),
    body('password').notEmpty().withMessage('密码不能为空')
  ],
  async (req, res) => {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, { errors: errors.array() }, '参数验证失败');
    }

    const { email, password } = req.body;

    try {
      // 查找用户并选择密码
      const user = await User.findOne({ email }).select('+password');
      
      if (user && (await user.matchPassword(password))) {
        // 生成token
        const token = generateToken(user._id);

        // RESTful响应
        sendResponse(res, 200, {
          userId: user._id,
          username: user.username,
          email: user.email,
          token: token
        }, '登录成功');
      } else {
        sendResponse(res, 401, null, '邮箱或密码错误');
      }
    } catch (error) {
      sendResponse(res, 500, null, '服务器错误：' + error.message);
    }
  }
);

// 请求密码重置 - 发送重置邮件
router.post('/forgot-password',
  [
    body('email').isEmail().withMessage('请提供有效的邮箱地址')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, { errors: errors.array() }, '参数验证失败');
    }

    try {
      const user = await User.findOne({ email: req.body.email });

      if (!user) {
        return sendResponse(res, 404, null, '未找到该邮箱对应的用户');
      }

      // 生成重置token
      const resetToken = crypto.randomBytes(32).toString('hex');
      user.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
      user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30分钟有效期

      await user.save();

      // 创建重置URL
      const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;

      // 发送重置邮件
      await sendEmail({
        email: user.email,
        subject: '密码重置请求',
        message: `您收到此邮件是因为您（或其他人）请求重置密码。请点击下面的链接重置密码：\n\n${resetUrl}\n\n如果您没有请求重置密码，请忽略此邮件。`
      });

      sendResponse(res, 200, null, '重置密码邮件已发送');
    } catch (error) {
      sendResponse(res, 500, null, '发送重置邮件失败：' + error.message);
    }
  }
);

// 重置密码
router.post('/reset-password/:resetToken',
  [
    body('password')
      .isLength({ min: 6 })
      .withMessage('密码至少6个字符')
      .matches(/\d/)
      .withMessage('密码必须包含数字')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, { errors: errors.array() }, '参数验证失败');
    }

    try {
      // 获取加密的重置token
      const resetPasswordToken = crypto
        .createHash('sha256')
        .update(req.params.resetToken)
        .digest('hex');

      const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
      });

      if (!user) {
        return sendResponse(res, 400, null, '无效或已过期的重置token');
      }

      // 设置新密码
      user.password = req.body.password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      // 生成新的登录token
      const token = generateToken(user._id);

      sendResponse(res, 200, { token }, '密码重置成功');
    } catch (error) {
      sendResponse(res, 500, null, '重置密码失败：' + error.message);
    }
  }
);

// 获取用户个人信息 - 读取资源 (GET)
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    sendResponse(res, 200, user, '获取用户信息成功');
  } catch (error) {
    sendResponse(res, 500, null, '获取用户信息失败：' + error.message);
  }
});

// 更改密码（已登录状态）
router.put('/change-password', protect,
  [
    body('currentPassword').notEmpty().withMessage('请提供当前密码'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('新密码至少6个字符')
      .matches(/\d/)
      .withMessage('密码必须包含数字')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, { errors: errors.array() }, '参数验证失败');
    }

    try {
      const user = await User.findById(req.user._id).select('+password');

      if (!(await user.matchPassword(req.body.currentPassword))) {
        return sendResponse(res, 401, null, '当前密码错误');
      }

      user.password = req.body.newPassword;
      await user.save();

      sendResponse(res, 200, null, '密码修改成功');
    } catch (error) {
      sendResponse(res, 500, null, '修改密码失败：' + error.message);
    }
  }
);

// 更新用户信息 - 更新资源 (PUT)
router.put('/profile', protect, 
  [
    body('username').optional().trim().isLength({ min: 3, max: 20 }).withMessage('用户名长度必须在3-20个字符之间')
  ],
  async (req, res) => {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, { errors: errors.array() }, '参数验证失败');
    }

    try {
      const user = await User.findById(req.user._id);

      // 更新允许的字段
      if (req.body.username) user.username = req.body.username;

      await user.save();

      sendResponse(res, 200, {
        userId: user._id,
        username: user.username
      }, '用户信息更新成功');
    } catch (error) {
      sendResponse(res, 500, null, '更新用户信息失败：' + error.message);
    }
  }
);

// 注销 - 删除会话资源 (POST)
router.post('/logout', protect, async (req, res) => {
  // 在JWT无状态的情况下，实际上只需要在客户端删除token
  sendResponse(res, 200, null, '注销成功');
});

module.exports = router;
