#!/bin/bash

# 更新系统包
apt-get update
apt-get upgrade -y

# 安装 Node.js 和 npm
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# 安装 MongoDB
apt-get install -y mongodb

# 创建项目目录
mkdir -p /var/www/personalweblog
cd /var/www/personalweblog

# 解压部署包
tar -xzf /root/deploy.tar.gz -C .

# 安装项目依赖
npm install

# 安装 PM2
npm install -g pm2

# 启动 MongoDB
service mongodb start

# 使用 PM2 启动应用
pm2 start server.js --name "personalweblog"

# 保存 PM2 进程列表
pm2 save

# 设置开机自启
pm2 startup
