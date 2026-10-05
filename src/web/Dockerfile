# ==============================================================================
# RentaTool LK - React Web Admin Operations Portal Dockerfile
# ==============================================================================

# --- Stage 1: Build Application ---
FROM node:20-alpine AS build
WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install dependencies cleanly
RUN npm ci

# Copy source files
COPY . .

# Build production bundle
RUN npm run build

# --- Stage 2: Serve via Nginx ---
FROM nginx:alpine AS final

# Remove default nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
