# Build Stage
FROM node:20-alpine AS build
WORKDIR /app

# Build arguments for Vite
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production Stage
FROM nginx:alpine

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

# Create a simple nginx config directly in the Dockerfile
# This avoids the "Starting Container" hang by being extremely lightweight
RUN echo 'server { \
    listen ${PORT}; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf.template

EXPOSE 80

# The CMD will replace ${PORT} and start nginx
CMD sh -c "envsubst \"\$PORT\" < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"