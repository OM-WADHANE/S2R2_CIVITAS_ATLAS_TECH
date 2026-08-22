# S2R2 Inventory System - Deployment Guide

## 🌐 Deployment Stack
- **Database**: Neon PostgreSQL (Serverless)
- **Backend**: Railway
- **Frontend**: Vercel

---

## 📊 Step 1: Deploy Database to Neon PostgreSQL

### 1.1 Create Neon Project
1. Go to [Neon Console](https://console.neon.tech)
2. Sign in / Sign up
3. Click **"New Project"**
4. Project settings:
   - Name: `s2r2-inventory`
   - Region: Choose closest to your users
   - PostgreSQL version: 15 or 16
5. Click **"Create Project"**

### 1.2 Get Connection String
After creation, Neon provides connection strings:
```
postgresql://[user]:[password]@[host]/[database]?sslmode=require
```

**Example:**
```
postgresql://sandeep:abc123@ep-cool-frost-12345.us-east-2.aws.neon.tech/s2r2db?sslmode=require
```

### 1.3 Get Both Connection URLs

Neon provides two connection strings:

**Pooled Connection** (for your app):
```
postgresql://user:pass@host-pooler/db?sslmode=require
```

**Direct Connection** (for migrations):
```
postgresql://user:pass@host/db?sslmode=require
```

---

## 🚂 Step 2: Deploy Backend to Railway

### 2.1 Create Railway Configuration

Create `backend/railway.json`:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run start:railway",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 2.2 Update package.json

Add these scripts to `backend/package.json`:
```json
{
  "scripts": {
    "start": "node server.js",
    "start:railway": "npx prisma migrate deploy && npx prisma generate && node server.js",
    "build": "npx prisma generate"
  }
}
```

### 2.3 Deploy to Railway

1. **Login to Railway**
   - Go to [railway.app](https://railway.app)
   - Click **"Start a New Project"**
   - **"Deploy from GitHub repo"**

2. **Select Repository**
   - Choose `s2r2-inventory`
   - Root directory: `backend`

3. **Add Environment Variables**

   Go to **Variables** tab:
   ```bash
   DATABASE_URL=postgresql://user:pass@host-pooler/db?sslmode=require
   DIRECT_URL=postgresql://user:pass@host/db?sslmode=require
   JWT_SECRET=generate-with-openssl-rand-base64-32
   FRONTEND_URL=https://your-app.vercel.app
   NODE_ENV=production
   PORT=4000
   ```

   **Generate JWT_SECRET:**
   ```bash
   openssl rand -base64 32
   ```

4. **Generate Domain**
   - Settings → Networking → Generate Domain
   - Copy URL: `https://your-backend.up.railway.app`

5. **Test Backend**
   ```bash
   curl https://your-backend.up.railway.app/health
   ```

---

## ▲ Step 3: Deploy Frontend to Vercel

### 3.1 Create Vercel Configuration

Create `frontend/vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

### 3.2 Deploy via Vercel Dashboard

1. **Go to Vercel**
   - Visit [vercel.com](https://vercel.com)
   - **"Add New Project"**
   - Import from GitHub

2. **Configure Project**
   - Framework: Next.js
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `.next`

3. **Environment Variables**
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app
   ```

4. **Deploy**
   - Click Deploy
   - Wait 2-3 minutes
   - Copy Vercel URL: `https://your-app.vercel.app`

### 3.3 Update Railway CORS

Go back to Railway and update:
```
FRONTEND_URL=https://your-app.vercel.app
```

Railway will auto-redeploy.

---

## 🗄️ Step 4: Seed Production Database

### 4.1 Create Production Seed File

Create `backend/seed-prod.js`:
```javascript
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding production database...');

  // Admin user
  const adminPassword = await bcrypt.hash('Admin@2025', 10);
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@s2r2tech.com',
      password: adminPassword,
      role: 'ADMIN',
      fullName: 'System Administrator'
    }
  });

  console.log('✅ Production seeded!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

### 4.2 Run Seed in Railway

In Railway terminal:
```bash
node seed-prod.js
```

---

## 🧪 Step 5: Testing

### Test Backend
```bash
curl https://your-backend.up.railway.app/health
```

### Test Frontend
Visit: `https://your-app.vercel.app`
- Login: admin / Admin@2025
- Test all features

---

## 🔐 Security Checklist

- [x] Strong JWT_SECRET
- [x] DATABASE_URL with SSL
- [x] CORS configured
- [x] Environment variables set
- [x] HTTPS enabled (automatic)

---

## 💰 Pricing

### Free Tier
- **Neon**: 0.5 GB free
- **Railway**: $5 credit/month
- **Vercel**: 100 GB bandwidth free

**Estimated Cost**: $0-10/month

---

## 🆘 Troubleshooting

### Connection Timeout
```
Error: connect ETIMEDOUT
```
**Fix**: Add `connect_timeout=15` to DATABASE_URL

### CORS Error
```
Access-Control-Allow-Origin
```
**Fix**: Verify FRONTEND_URL matches Vercel URL exactly

### Prisma Not Generated
```
Prisma Client not found
```
**Fix**: Ensure `build` script has `prisma generate`

---

## 📞 Support

- **Neon**: [docs.neon.tech](https://docs.neon.tech)
- **Railway**: [docs.railway.app](https://docs.railway.app)
- **Vercel**: [vercel.com/docs](https://vercel.com/docs)

---

**© 2025 S2R2 Technologies**
