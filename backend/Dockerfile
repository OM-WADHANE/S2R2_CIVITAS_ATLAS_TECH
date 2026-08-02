FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies and generate Prisma client
RUN npm ci && npx prisma generate

# Copy rest of the source
COPY . .

# Expose port
EXPOSE 4000

# Start
CMD ["node", "server.js"]
