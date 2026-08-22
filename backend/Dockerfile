FROM node:20-alpine

WORKDIR /app

# Copy package files and prisma schema first (better layer caching)
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies and generate Prisma client
RUN npm ci && npx prisma generate

# Copy the rest of the source code
COPY . .

# Expose API port
EXPOSE 4000

# Push schema to DB then start server
# DATABASE_URL must be set as an environment variable at runtime
CMD ["sh", "-c", "npx prisma db push --skip-generate && node server.js"]
