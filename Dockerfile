# YYC³ Family-AI Dockerfile
# 多阶段构建 - 用于企业私有部署

# ============================================
# Stage 1: 构建阶段
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# 安装依赖
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建生产版本
RUN pnpm build

# ============================================
# Stage 2: 生产阶段
# ============================================
FROM nginx:alpine AS production

# 安装 curl 用于健康检查
RUN apk add --no-cache curl

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 nginx 配置
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# 复制健康检查脚本
COPY docker/healthcheck.sh /healthcheck.sh
RUN chmod +x /healthcheck.sh

# 暴露端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD /healthcheck.sh || exit 1

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]

# ============================================
# Labels
# ============================================
LABEL org.opencontainers.image.title="YYC³ Family AI"
LABEL org.opencontainers.image.description="开源本地 AI 编程助手"
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.authors="YanYuCloudCube Team"
LABEL org.opencontainers.image.url="https://github.com/YanYuCloudCube/YYC3-Family-AI"
LABEL org.opencontainers.image.source="https://github.com/YanYuCloudCube/YYC3-Family-AI"
LABEL org.opencontainers.image.licenses="MIT"
