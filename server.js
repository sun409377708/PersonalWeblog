const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const multer = require('multer');
const fs = require('fs');

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, 'public/images');
    // 确保上传目录存在
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // 保持原始文件名
    cb(null, file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // 只允许上传图片
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('只允许上传图片文件！'), false);
    }
    cb(null, true);
  }
});

// 中间件
app.use(cors());
app.use(express.json());

// 静态文件服务
const publicPath = path.join(__dirname, 'public');
console.log('Static files will be served from:', publicPath);
app.use(express.static(publicPath));

// 数据库连接配置
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost:27017/blog', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    setTimeout(connectDB, 5000);
  }
};

// 连接数据库
connectDB();

// 导入路由
const authRoutes = require('./backend/src/routes/authRoutes');
app.use('/api/auth', authRoutes);

// 图片上传路由
app.post('/api/upload/avatar', upload.single('avatar'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '没有上传文件' });
    }
    res.json({ 
      message: '头像上传成功',
      filename: req.file.filename,
      path: `/images/${req.file.filename}`
    });
  } catch (error) {
    res.status(500).json({ message: '上传失败', error: error.message });
  }
});

// 获取所有图片
app.get('/api/images', (req, res) => {
  const imagesPath = path.join(__dirname, 'public/images');
  fs.readdir(imagesPath, (err, files) => {
    if (err) {
      return res.status(500).json({ message: '获取图片列表失败', error: err.message });
    }
    const images = files.filter(file => file.match(/\.(jpg|jpeg|png|gif)$/));
    res.json(images);
  });
});

// 删除图片
app.delete('/api/images/:filename', (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(__dirname, 'public/images', filename);
  
  fs.unlink(filepath, (err) => {
    if (err) {
      return res.status(500).json({ message: '删除图片失败', error: err.message });
    }
    res.json({ message: '图片删除成功' });
  });
});

// 个人信息保存路由
app.post('/api/profile', upload.single('avatar'), (req, res) => {
  try {
    const { name, bio, github, twitter, about } = req.body;

    // 这里可以将个人信息保存到数据库中
    // 示例：
    // await User.updateOne({ _id: req.user.id }, { name, bio, github, twitter, about, avatar: req.file.filename });

    res.json({ message: '个人信息保存成功' });
  } catch (error) {
    res.status(500).json({ message: '保存失败', error: error.message });
  }
});

// 路由处理
app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

app.get('/login', (req, res) => {
  const loginPath = path.join(publicPath, 'login.html');
  console.log('Attempting to serve login page from:', loginPath);
  res.sendFile(loginPath);
});

app.get('/register', (req, res) => {
  const registerPath = path.join(publicPath, 'register.html');
  console.log('Attempting to serve register page from:', registerPath);
  res.sendFile(registerPath);
});

app.get('/forgot-password', (req, res) => {
  const forgotPasswordPath = path.join(publicPath, 'forgot-password.html');
  console.log('Attempting to serve forgot-password page from:', forgotPasswordPath);
  res.sendFile(forgotPasswordPath);
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(publicPath, 'about.html'));
});

app.get('/archive', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.stack : {}
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).sendFile(path.join(publicPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log('Public directory path:', publicPath);
});

module.exports = app;
