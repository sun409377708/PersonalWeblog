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

## 🚀 从零开始部署你的第一个网站！

### 第一步：在自己电脑上开发网站

1. **准备工作**：
   - 安装 Node.js（就像安装微信一样简单）
   - 安装 MongoDB（这是存储数据的地方，类似于Excel）

2. **创建项目**：
   ```bash
   # 创建一个新文件夹
   mkdir PersonalWeblog
   cd PersonalWeblog
   
   # 初始化项目（生成package.json文件）
   npm init -y
   ```

3. **安装需要的工具**（就像在手机上装APP一样）：
   ```bash
   # 一次性安装所有需要的工具
   npm install express mongoose dotenv cors multer bcryptjs jsonwebtoken nodemailer express-validator
   ```

4. **创建配置文件（.env）**：
   ```
   # 这些是网站运行需要的基本信息
   PORT=3000                    # 网站运行的端口号
   MONGODB_URI=mongodb://localhost:27017/personalweblog   # 数据库地址
   JWT_SECRET=你的密钥           # 用于加密的密钥
   EMAIL_SERVICE=gmail          # 邮件服务
   EMAIL_USER=你的邮箱
   EMAIL_PASS=邮箱密码
   ```

### 第二步：把网站放到云服务器上

1. **准备服务器环境**：
   ```bash
   # 登录到你的服务器（相当于用钥匙开门进房子）
   ssh root@你的服务器IP
   
   # 安装需要的软件
   # 更新系统（相当于打扫房间）
   apt update && apt upgrade -y
   
   # 安装 Node.js（相当于安装电灯）
   curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
   apt install -y nodejs
   
   # 安装 MongoDB（相当于安装储物柜）
   apt install -y mongodb-org
   systemctl start mongod
   systemctl enable mongod
   
   # 安装 Nginx（相当于安装大门）
   apt install nginx -y
   
   # 安装 PM2（相当于请一个管家，帮你照看网站）
   npm install -g pm2
   ```

2. **上传网站文件**：
   ```bash
   # 从你的电脑上传文件到服务器（相当于搬家）
   scp -r ./* root@你的服务器IP:/root/PersonalWeblog
   ```

3. **启动网站**：
   ```bash
   # 进入网站目录
   cd PersonalWeblog
   
   # 安装需要的工具
   npm install
   
   # 启动网站（让管家PM2帮你看着网站）
   pm2 start server.js --name "personalweblog"
   ```

4. **设置访问方式**：
   ```bash
   # 创建 Nginx 配置（告诉访客怎么找到你的网站）
   nano /etc/nginx/conf.d/personalweblog.conf
   
   # 添加以下内容：
   server {
       listen 80;                 # 监听80端口（就像门牌号）
       server_name 你的服务器IP;   # 服务器IP地址
   
       location / {
           proxy_pass http://localhost:3000;  # 转发到你的网站
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   
   # 重启 Nginx（相当于重新布置门牌号）
   nginx -t              # 检查配置是否正确
   systemctl restart nginx  # 重启Nginx
   ```

### 日常维护（像管理你的手机一样简单）

1. **查看网站状态**：
   ```bash
   pm2 status              # 看网站是否正常运行
   pm2 logs personalweblog # 查看运行日志（有没有报错）
   ```

2. **重启网站**：
   ```bash
   pm2 restart personalweblog  # 就像重启手机一样
   ```

3. **常见问题解决**：
   - 网站打不开？
     1. 检查 PM2 状态：`pm2 status`
     2. 检查 Nginx 状态：`systemctl status nginx`
     3. 查看错误日志：`pm2 logs personalweblog`
   
   - 修改了代码后更新？
     1. 重新上传代码
     2. 运行 `pm2 restart personalweblog`

### 安全提示
- 记得修改服务器密码
- 保管好所有密码和密钥
- 定期备份数据

现在，你的网站应该可以通过 `http://你的服务器IP` 访问了！

需要帮助？记录下错误信息，这样可以更容易找到解决方案！
