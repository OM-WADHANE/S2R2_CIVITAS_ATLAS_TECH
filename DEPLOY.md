# Deployment Guide — S2R2 Inventory System

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Browser  →  Vercel (Next.js)  →  Railway (Express)   │
│                                         ↕               │
│                                   Neon PostgreSQL       │
│                                 (already live/seeded)   │
└─────────────────────────────────────────────────────────┘
```

- **Frontend** → Vercel (free tier, auto-deploys from GitHub)
- **Backend**  → Railway (free $5 credit, always-on)
- **Database** → Neon (already running, no changes needed)

---

## Before You Start

You need:
- [ ] GitHub account with this repo pushed
- [ ] [railway.app](https://railway.app) account (sign up with GitHub)
- [ ] [vercel.com](https://vercel.com) account (sign up with GitHub)

Push your code to GitHub first (if not done already):

```bash
cd s2r2-inventory
git add .
git commit -m "ready for deploy"
git push origin main
```

---

## PART 1 — Deploy Backend on Railway

### Step 1 — Create new project

1. Go to [railway.app](https://railway.app)
2. Click **New Project**
3. Click **Deploy from GitHub repo**
4. Select your `s2r2-inventory` repository
5. Railway will show you a service — click it

### Step 2 — Set the root directory

1. Click on the service card
2. Go to **Settings** tab
3. Under **Source** → **Root Directory** → type `backend`
4. Click **Save**

Railway will now only look inside the `backend/` folder.

### Step 3 — Add environment variables

1. Click **Variables** tab
2. Click **Raw Editor** (easier to paste all at once)
3. Paste this exactly — **replace nothing except the URLs you already have**:

```
DATABASE_URL=postgresql://neondb_owner:npg_xPqbZrCIf3w6@ep-round-rice-azwtfm6m-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
DIRECT_URL=postgresql://neondb_owner:npg_xPqbZrCIf3w6@ep-round-rice-azwtfm6m.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=s2r2IOT
PORT=4000
FRONTEND_URL=https://placeholder.vercel.app
```

> Note: `FRONTEND_URL` is a placeholder for now. You will update it after Vercel gives you the real URL in Part 2.

4. Click **Save Changes** — Railway will auto-deploy

### Step 4 — Generate a public URL

1. Go to **Settings** tab
2. Scroll to **Networking**
3. Click **Generate Domain**
4. Copy the URL — it looks like:
   ```
   https://s2r2-inventory-api-production.up.railway.app
   ```
   **Save this URL — you need it for Vercel.**

### Step 5 — Verify it works

Open in browser:
```
https://your-railway-url.up.railway.app/health
```

You should see:
```json
{ "status": "ok", "ts": "2025-..." }
```

If you see that — backend is live. ✅

---

## PART 2 — Deploy Frontend on Vercel

### Step 1 — Create new project

1. Go to [vercel.com](https://vercel.com)
2. Click **Add New** → **Project**
3. Click **Import** next to your `s2r2-inventory` repo
4. Vercel will show configuration options

### Step 2 — Configure the project

1. Under **Root Directory** → click **Edit** → type `frontend` → click **Continue**
2. Framework Preset should auto-detect **Next.js** — leave it
3. Build & Output Settings — leave everything as default

### Step 3 — Add environment variable

1. Expand **Environment Variables**
2. Add this one variable:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_API_URL` | `https://your-railway-url.up.railway.app` |

Replace the value with your actual Railway URL from Part 1 Step 4.

3. Click **Deploy**

Vercel will build and deploy — takes about 2 minutes.

### Step 4 — Copy your Vercel URL

After deploy succeeds, Vercel shows your URL:
```
https://s2r2-inventory.vercel.app
```
Copy it.

---

## PART 3 — Update Railway with final Vercel URL

This step fixes CORS so the frontend can talk to the backend.

1. Go back to **Railway** → your backend service → **Variables**
2. Find `FRONTEND_URL`
3. Change the value to your real Vercel URL:
   ```
   FRONTEND_URL=https://s2r2-inventory.vercel.app
   ```
4. Click **Save** — Railway redeploys automatically (takes ~30 seconds)

---

## Final Check

Open your Vercel URL in the browser.

- Login page loads ✅
- Login with `s2r2admin` / `s2r2Admin1` ✅
- Dashboard shows data ✅
- Raw Materials, Finished Products, Clients all load ✅

---

## Credentials (live in Neon already)

| Username    | Password      | Role   |
|-------------|---------------|--------|
| `s2r2admin` | `s2r2Admin1`  | ADMIN  |
| `admin`     | `Admin2025`   | ADMIN  |
| `manager`   | `Manager2025` | ADMIN  |
| `superuser` | `Super2025s2` | ADMIN  |
| `editor1`   | `Editor2025a` | EDITOR |
| `editor2`   | `Editor2025b` | EDITOR |

---

## Troubleshooting

### Login fails / API not reachable
- Check Railway logs: Railway → service → **Logs** tab
- Confirm `NEXT_PUBLIC_API_URL` in Vercel matches your Railway domain exactly (no trailing slash)
- Confirm `/health` endpoint returns OK

### CORS error in browser console
- `FRONTEND_URL` in Railway is wrong or still the placeholder
- Update it to your exact Vercel URL and redeploy

### Vercel build fails
- Check the build log for errors
- Make sure root directory is set to `frontend` not the repo root

### Railway deploy stuck / failed
- Check **Build Logs** tab
- Most common cause: wrong root directory — must be `backend`
- Try clicking **Redeploy** after fixing variables

### Database not connecting
- Your Neon DB is already live and seeded
- The `DATABASE_URL` in Railway must match exactly what is in `backend/.env`
- Neon free tier sleeps after 5 days of inactivity — wake it up at console.neon.tech

---

## Re-deploying after code changes

Once everything is set up, deploying updates is automatic:

```bash
git add .
git commit -m "your change description"
git push origin main
```

- Vercel detects the push → rebuilds frontend automatically
- Railway detects the push → rebuilds backend automatically

No manual steps needed.

---

## Cost

| Service | Plan  | Cost       |
|---------|-------|------------|
| Vercel  | Hobby | **Free**   |
| Railway | Trial | **Free** ($5 credit, then ~$5/mo for hobby) |
| Neon    | Free  | **Free**   |

---

*S2R2 Inventory Management System — Civitas Atlas Technologies Pvt. Ltd., Pune*
