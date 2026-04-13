#!/bin/sh
# YYC³ Family-AI 健康检查脚本

# 检查 nginx 是否运行
if ! pgrep nginx > /dev/null; then
    echo "nginx is not running"
    exit 1
fi

# 检查健康端点
if ! curl -sf http://localhost/health > /dev/null 2>&1; then
    echo "health check failed"
    exit 1
fi

echo "healthy"
exit 0
