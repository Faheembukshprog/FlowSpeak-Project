# ==============================================================================
# STAGE 1: Build the React + Vite Frontend App
# ==============================================================================
FROM node:20.12-alpine AS builder
WORKDIR /app

# Leverage caching for dependency resolution
COPY package*.json ./
RUN npm ci

# Copy code and build production bundle
COPY . .
RUN npm run build

# ==============================================================================
# STAGE 2: Serve using Highly Secure, Optimized Nginx
# ==============================================================================
FROM nginx:1.25.4-alpine AS final

# Custom non-root nginx configuration mapping port 8080
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Clean default assets and copy production build assets
RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/dist /usr/share/nginx/html

# Adjust file permissions for non-root execution
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /var/log/nginx /etc/nginx/conf.d

# Run Nginx as the pre-configured 'nginx' system user
USER nginx

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
