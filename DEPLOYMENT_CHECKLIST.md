# S2R2 Inventory — Deployment Checklist

## Pre-Deployment

- [ ] Code pushed to GitHub
- [ ] Neon DB migrated and seeded
- [ ] All environment variables set on Railway and Vercel

---

## 1. Neon Database

- [ ] Project created at console.neon.tech
- [ ] Pooled connection string copied → `DATABASE_URL`
- [ ] Direct connection string copied → `DIRECT_URL`
- [ ] `npx prisma migrate deploy` run from `backend/`
- [ ] `node seed-prod.js` run from `backend/`

---

## 2. Railway (Backend)

- [ ] Logged in to railway.app with GitHub
- [ ] New Project → Deploy from GitHub → select repo
- [ ] Root directory set to: `backend`
- [ ] All environment variables added (see `backend/.env.example`)
- [ ] Start command: `npm run start:railway`
- [ ] Domain generated (Settings → Networking → Generate Domain)
- [ ] `/health` endpoint returns `{ "status": "ok" }`

### Required Railway environment variables
See `backend/.env.example` for all required variables and descriptions.
Never paste real credentials into documentation files.

---

## 3. Vercel (Frontend)

- [ ] Logged in to vercel.com with GitHub
- [ ] New Project → Import repo
- [ ] Root directory: `frontend`
- [ ] Framework: Next.js (auto-detected)
- [ ] `NEXT_PUBLIC_API_URL` set to Railway URL
- [ ] Deployed successfully

### Post-Deploy
- [ ] Copy Vercel URL
- [ ] Update `FRONTEND_URL` on Railway with Vercel URL
- [ ] Test login

---

## 4. Verification

- [ ] `/health` returns status ok
- [ ] Login works with seeded credentials
- [ ] Dashboard loads with data
- [ ] Raw Materials page works
- [ ] Finished Products page works
- [ ] BOM page works
- [ ] Intelligence / Civi AI works

---

## Cost Summary

| Service | Free Tier | Paid |
|---------|-----------|------|
| Neon | 0.5 GB storage | FREE |
| Railway | $5 credit/mo | ~$5-10/mo |
| Vercel | 100 GB bandwidth | FREE |

---

## Support

- Neon: docs.neon.tech
- Railway: docs.railway.app
- Vercel: vercel.com/docs

**© Civitas Atlas Technologies Pvt. Ltd., Pune, India**
