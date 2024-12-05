#!/bin/bash

# 输出颜色设置
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查命令执行状态
check_status() {
    if [ $? -eq 0 ]; then
        log_info "$1 成功"
    else
        log_error "$1 失败"
        exit 1
    fi
}

# 1. 安装基础依赖
log_info "开始安装基础依赖..."

# 安装 Node.js
if ! command -v node &> /dev/null; then
    log_info "安装 Node.js..."
    curl -sL https://rpm.nodesource.com/setup_18.x | bash -
    yum install -y nodejs
    check_status "Node.js 安装"
fi

# 安装 MongoDB
if ! command -v mongod &> /dev/null; then
    log_info "安装 MongoDB..."
    echo "[mongodb-org-4.4]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/7/mongodb-org/4.4/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-4.4.asc" > /etc/yum.repos.d/mongodb-org-4.4.repo
    yum install -y mongodb-org
    check_status "MongoDB 安装"
    
    systemctl enable mongod
    systemctl start mongod
    check_status "MongoDB 服务启动"
fi

# 2. 准备部署目录
log_info "准备部署目录..."
APP_DIR="/var/www/personalweblog"
mkdir -p $APP_DIR
cd $APP_DIR
check_status "创建部署目录"

# 3. 清理旧文件
log_info "清理旧文件..."
rm -rf $APP_DIR/*
check_status "清理旧文件"

# 4. 解压新文件
log_info "解压部署包..."
tar -xzf /root/blog/deploy.tar.gz -C .
check_status "解压部署包"

# 5. 创建必要的目录结构
log_info "创建目录结构..."
mkdir -p routes utils middleware models
check_status "创建目录"

# 6. 移动文件到正确位置
log_info "移动文件到正确位置..."
if [ -d "backend/src/routes" ]; then
    cp -r backend/src/routes/* routes/
    check_status "复制 routes 文件"
fi

if [ -d "backend/src/utils" ]; then
    cp -r backend/src/utils/* utils/
    check_status "复制 utils 文件"
fi

if [ -d "backend/src/middleware" ]; then
    cp -r backend/src/middleware/* middleware/
    check_status "复制 middleware 文件"
fi

if [ -d "backend/src/models" ]; then
    cp -r backend/src/models/* models/
    check_status "复制 models 文件"
fi

# 7. 安装项目依赖
log_info "安装项目依赖..."
npm install
check_status "NPM 依赖安装"

# 8. 安装和配置 PM2
if ! command -v pm2 &> /dev/null; then
    log_info "安装 PM2..."
    npm install -g pm2
    check_status "PM2 安装"
fi

# 9. 启动应用
log_info "启动应用..."
pm2 delete personalweblog 2>/dev/null || true
pm2 start server.js --name "personalweblog"
check_status "应用启动"

# 10. 保存 PM2 配置
log_info "保存 PM2 配置..."
pm2 save
pm2 startup
check_status "PM2 配置保存"

# 11. 输出重要信息
log_info "部署完成！"
echo "----------------------------------------"
echo "应用信息："
echo "- 部署目录：$APP_DIR"
echo "- 日志位置："
echo "  - 错误日志：~/.pm2/logs/personalweblog-error.log"
echo "  - 输出日志：~/.pm2/logs/personalweblog-out.log"
echo "----------------------------------------"

# 12. 检查服务状态
log_info "检查服务状态..."
pm2 status
mongod --version
node --version
npm --version
