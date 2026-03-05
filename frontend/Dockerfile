FROM node:20-alpine
WORKDIR /app

# Required for Vite build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

# Use serve to host the static files
# This is more reliable on Railway than Nginx templates
EXPOSE 3000

CMD ["npm", "run", "start"]