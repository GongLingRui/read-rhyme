# Read-Rhyme Frontend Dockerfile
# 多阶段构建优化镜像大小

# ==================== 阶段1: 依赖安装 ====================
FROM node:18-alpine AS deps

WORKDIR /app

# 安装pnpm
RUN npm install -g pnpm

# 复制package文件
COPY package.json pnpm-lock.yaml* ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# ==================== 阶段2: 构建 ====================
FROM node:18-alpine AS builder

WORKDIR /app

# 安装pnpm
RUN npm install -g pnpm

# 从deps阶段复制node_modules
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 设置构建时环境变量
ENV VITE_API_BASE_URL=http://localhost:8000/api
ENV VITE_WS_BASE_URL=ws://localhost:8000/ws

# 构建应用
RUN pnpm run build

# ==================== 阶段3: 生产环境 ====================
FROM nginx:alpine AS runner

WORKDIR /app

# 从构建阶段复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制自定义nginx配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]
