# Build Stage
FROM node:18-alpine

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "server.js"]
