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
const PORT = process.env.PORT || 3001;

// 连接MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blog', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('MongoDB connected successfully');
}).catch((err) => {
    console.error('MongoDB connection error:', err);
});

// 导入模型
const Post = require('./models/Post');

// 配置文件上传
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, 'public/images');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
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

// API 路由
// 获取单篇文章
app.get('/api/posts/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: '文章未找到' });
        }

        // 获取上一篇和下一篇文章
        const prevPost = await Post.findOne(
            { date: { $gt: post.date } },
            { _id: 1, title: 1 }
        ).sort({ date: 1 });
        
        const nextPost = await Post.findOne(
            { date: { $lt: post.date } },
            { _id: 1, title: 1 }
        ).sort({ date: -1 });

        // 格式化日期
        const formattedDate = new Date(post.date).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        res.json({
            ...post.toObject(),
            date: formattedDate,
            prevPost: prevPost ? {
                id: prevPost._id,
                title: prevPost.title
            } : null,
            nextPost: nextPost ? {
                id: nextPost._id,
                title: nextPost.title
            } : null
        });
    } catch (error) {
        console.error('Error fetching post:', error);
        res.status(500).json({ message: '服务器错误' });
    }
});

// 获取文章列表
app.get('/api/posts', async (req, res) => {
    try {
        console.log('Fetching posts with MongoDB URI:', process.env.MONGODB_URI || 'mongodb://localhost:27017/blog');
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        console.log('Attempting to fetch posts with params:', { page, limit, skip });
        const posts = await Post.find()
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit)
            .select('title date category excerpt');

        console.log('Found posts:', posts);
        const total = await Post.countDocuments();
        console.log('Total posts:', total);

        res.json({
            posts,
            total,
            currentPage: page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Error in /api/posts:', error);
        res.status(500).json({ message: '服务器错误', error: error.message });
    }
});

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

// 导入路由
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// 前端路由
app.get('/post/:id', (req, res) => {
    res.sendFile(path.join(publicPath, 'post.html'));
});

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

app.get('/architecture', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'architecture.html'));
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.stack);
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.stack : {}
    });
});

// 404 处理
app.use((req, res) => {
    res.status(404).sendFile(path.join(publicPath, '404.html'));
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
