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

# Install envsubst if not present (it usually is in nginx:alpine)
RUN apk add --no-cache gettext

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

# Create the template
RUN echo 'server { \
    listen ${PORT}; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf.template

EXPOSE 80

# This is a backup, railway.toml will take precedence
CMD sh -c "envsubst '\$PORT' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"