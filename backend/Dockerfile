FROM node:20-alpine

# Install OpenSSL — required by Prisma query engine on Alpine
RUN apk add --no-cache openssl libc6-compat

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

# Run migrations then start server
# DATABASE_URL and DIRECT_URL must be set as environment variables at runtime
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
