const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 数据库连接
const connectDB = require('./config/database');
connectDB();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 路由
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// 基础路由
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Welcome to Jianqin Backend API',
    status: 'OK',
    database: 'MongoDB connected'
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err.stack
  });
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on port ${PORT}`);
});

module.exports = app;
