# Stage 1: Build the React application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY frontend/package*.json ./

# Clean install dependencies (including devDependencies for TypeScript build)
RUN npm ci

# Copy application source code
COPY frontend/ ./

# Run production build
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:1.25-alpine AS runner

# Copy custom Nginx configuration
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
