#!/bin/bash

# 停止MongoDB服务
systemctl stop mongod

# 清理现有数据
rm -rf /var/lib/mongo/*

# 启动MongoDB服务
systemctl start mongod
sleep 5

# 解压数据
cd /root
rm -rf data
tar xzf db_data.tar.gz

# 复制数据
cp -r data/db/* /var/lib/mongo/
chown -R mongod:mongod /var/lib/mongo

# 重启MongoDB服务
systemctl restart mongod
sleep 5

# 重启应用
pm2 restart personalweblog
