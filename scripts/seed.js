const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Post = require('../models/Post');

// 加载环境变量
dotenv.config();

// 示例文章数据
const samplePosts = [
    {
        title: "第一篇博客文章",
        content: `这是第一篇博客文章的完整内容。

今天是个特别的日子，我决定开始写博客。通过这个平台，我希望能够：

1. 记录生活中的点点滴滴
2. 分享技术学习的心得
3. 结识志同道合的朋友

让我们一起开启这段美好的旅程！`,
        excerpt: "这是第一篇博客文章的摘要。简单记录一下今天的心情和感悟...",
        date: new Date('2023-12-02'),
        category: "生活随笔",
        slug: "first-blog-post"
    },
    {
        title: "如何搭建一个简约的博客",
        content: `搭建一个简约的博客需要考虑以下几个方面：

1. 选择合适的技术栈
   - Node.js + Express 作为后端
   - MongoDB 作为数据库
   - 原生 JavaScript 构建前端

2. 设计简洁的界面
   - 专注于内容展示
   - 合理的留白
   - 清晰的层次结构

3. 实现基础功能
   - 文章的增删改查
   - 分类管理
   - 评论系统
   - 用户认证

4. 性能优化
   - 合理的缓存策略
   - 图片懒加载
   - 代码分割

后续我会详细介绍每个部分的具体实现。`,
        excerpt: "想要搭建一个简约的博客？本文将为你详细介绍整个过程...",
        date: new Date('2023-12-01'),
        category: "技术",
        slug: "how-to-build-minimalist-blog"
    }
];

// 连接数据库并添加示例数据
async function seedDatabase() {
    try {
        // 连接数据库
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blog', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        // 清空现有文章
        await Post.deleteMany({});
        console.log('Cleared existing posts');

        // 添加示例文章
        const posts = await Post.insertMany(samplePosts);
        console.log(`Added ${posts.length} sample posts`);

        console.log('Database seeding completed successfully');
    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        // 关闭数据库连接
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
}

// 运行数据库种子脚本
seedDatabase();
