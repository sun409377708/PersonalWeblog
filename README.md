# Node.js 项目说明

## 项目结构
```
.
├── server.js         # 主服务器文件
├── backend/          # 后端代码目录
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   └── middleware/
├── package.json      # 项目依赖配置
├── .env             # 环境变量配置
└── public/          # 静态文件目录
    └── login.html   # 登录页面
```

## 本地开发环境设置

### 1. 安装依赖
确保你的系统已安装：
- Node.js (推荐 v16 或更高版本)
- MongoDB (v8.0.3 或更高版本)

### 2. 安装项目依赖
```bash
npm install
```

### 3. 启动 MongoDB
```bash
# 创建数据目录
mkdir -p data/db

# 启动 MongoDB 服务
./mongodb-macos-x86_64-8.0.3/bin/mongod --dbpath data/db
```

### 4. 启动应用服务器
```bash
node server.js
```

应用将在 http://localhost:3000 上运行。

## 阿里云服务器部署步骤

### 1. 服务器环境配置
```bash
# 更新包管理器
sudo apt update
sudo apt upgrade

# 安装 Node.js 和 npm（如果还没安装）
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs

# 验证安装
node --version
npm --version
```

### 2. 项目部署

#### 方法一：使用 Git（推荐）
1. 在服务器上安装 Git：
```bash
sudo apt install git
```

2. 克隆项目到服务器：
```bash
git clone [你的项目仓库地址]
cd [项目目录]
```

#### 方法二：直接上传文件
使用 scp 命令从本地上传到服务器：
```bash
scp -r ./* root@你的服务器IP:/root/node-server
```

### 3. 安装项目依赖
```bash
cd [项目目录]
npm install
```

### 4. 使用 PM2 运行服务器（推荐）
```bash
# 安装 PM2
sudo npm install -g pm2

# 启动服务
pm2 start server.js --name "node-server"

# 其他常用 PM2 命令
pm2 status        # 查看服务状态
pm2 logs          # 查看日志
pm2 restart all   # 重启所有服务
pm2 stop all      # 停止所有服务
```

### 5. 配置防火墙
1. 在阿里云控制台中：
   - 进入实例的安全组配置
   - 添加安全组规则
   - 开放 3000 端口（或你设置的其他端口）
   - 协议类型选择 TCP

### 6. 配置Nginx

Nginx已配置为反向代理Node.js应用程序，这意味着您可以通过默认HTTP端口（80）访问您的应用程序，而无需指定端口号。

#### Nginx配置摘要
- 监听80端口，将请求转发到Node.js应用程序（3000端口）
- 支持通过域名访问（例如：http://jianqin.fun）

#### 测试访问
在浏览器中访问以下URL以测试您的应用程序：

```
http://8.130.132.215
```

或

```
http://jianqin.fun
```

确保您的域名已正确解析到服务器IP。

### 7. 访问测试
在浏览器中访问：
```
http://你的服务器IP:3000
```

## 后端开发

### 安装依赖
```bash
cd backend
npm install
```

### 运行后端服务
```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

### 环境变量
请在 `.env` 文件中配置：
- `PORT`：服务器端口
- `NODE_ENV`：运行环境
- `DATABASE_URL`：数据库连接地址
- `JWT_SECRET`：JWT密钥

## 注意事项
1. 确保服务器的安全组规则已开放对应端口
2. 建议使用 PM2 来管理 Node.js 进程
3. 生产环境建议配置 Nginx 反向代理
4. 建议配置 SSL 证书启用 HTTPS
