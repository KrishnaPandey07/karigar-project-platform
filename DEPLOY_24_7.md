# 🌐 24/7 Cloud Deployment Guide (100% Free Forever)
## कारीगर (Karigar) - भारत का विश्वसनीय कारीगर व सेवा मंच

This guide walks you through deploying **Karigar** online 24 hours a day, 7 days a week, with automatic HTTPS SSL, custom subdomains, and zero hosting costs.

---

## 🏛️ High-Level 24/7 Architecture

| Component | Recommended Cloud Provider | Free Tier Benefits | Alternative Options |
|---|---|---|---|
| **Database** | **[Neon.tech](https://neon.tech)** | Serverless PostgreSQL, 0.5 GB storage, automatic SSL | [Supabase](https://supabase.com) |
| **Backend API** | **[Render.com](https://render.com)** | Free Web Service, automated Git deploys, free HTTPS | [Railway](https://railway.app), [Koyeb](https://koyeb.com) |
| **Frontend Web** | **[Vercel.com](https://vercel.com)** | Global Edge CDN, lightning-fast SSR/SPA, auto previews | [Cloudflare Pages](https://pages.cloudflare.com), [Netlify](https://netlify.com) |
| **24/7 Liveness** | **[UptimeRobot](https://uptimerobot.com)** | 50 free monitors, pings `/api/v1/health` every 5 min to prevent sleep | [Cron-Job.org](https://cron-job.org) |

---

## 🚀 Step 1: Provision 24/7 Cloud PostgreSQL (Neon)

1. Go to [https://neon.tech](https://neon.tech) and sign up with your GitHub account.
2. Click **Create Project**, name it `karigar-db`.
3. Under **Connection Details**, select **Node.js / Prisma**.
4. Copy your PostgreSQL Connection String. It looks like:
   ```text
   postgresql://karigar_owner:abc123xyz@ep-fragrant-pond-123456.ap-southeast-1.aws.neon.tech/karigar?sslmode=require
   ```
5. Keep this string safe; you will paste it into your backend environment variables.

---

## ⚙️ Step 2: Deploy Backend API on Render

1. Go to [https://render.com](https://render.com) and log in with your GitHub account.
2. Click **New +** > **Web Service**.
3. Select your uploaded GitHub repository `Karigar-Platform`.
4. Configure the service settings:
   - **Name**: `karigar-backend`
   - **Region**: Singapore (`Singapore - Southeast Asia` is closest to India for <40ms ping)
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     npm install && npx prisma generate && npx prisma db push
     ```
   - **Start Command**:
     ```bash
     npm start
     ```
   - **Instance Type**: `Free`
5. Click **Advanced** > **Add Environment Variable** and add:
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `DATABASE_URL`: *(Paste your Neon connection string from Step 1)*
   - `JWT_ACCESS_SECRET`: *(A random 32-character string, e.g. `karigar_live_access_key_999`)*
   - `JWT_REFRESH_SECRET`: *(A random 32-character string, e.g. `karigar_live_refresh_key_888`)*
   - `COOKIE_SECRET`: *(A random 32-character string, e.g. `karigar_cookie_live_secret_777`)*
   - `CORS_ORIGIN`: `*` *(or update to your Vercel frontend URL after Step 3)*
6. Click **Deploy Web Service**.
7. Once deployed, Render gives you a public URL like:
   `https://karigar-backend.onrender.com`
   Test it by visiting `https://karigar-backend.onrender.com/api/v1/health` (should return `{ "status": "UP" }`).

---

## 🎨 Step 3: Deploy Frontend on Vercel

1. Go to [https://vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **Add New...** > **Project**.
3. Import your `Karigar-Platform` repository.
4. In the configuration screen:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click `Edit` and select `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Expand **Environment Variables**:
   - `VITE_API_URL`: `https://karigar-backend.onrender.com/api/v1` *(replace with your Render backend URL)*
6. Click **Deploy**.
7. In ~30 seconds, your site is live globally on a custom URL (e.g. `https://karigar-platform.vercel.app`)!

---

## ⏰ Step 4: Keep Render Awake 24/7 (Prevent Free Tier Sleep)

Render's free tier spins down web services after 15 minutes of inactivity. To keep your backend hot and responsive 24 hours a day:

1. Sign up for free at [https://uptimerobot.com](https://uptimerobot.com).
2. Click **Add New Monitor**:
   - **Monitor Type**: `HTTP(s)`
   - **Friendly Name**: `Karigar Backend Health`
   - **URL**: `https://karigar-backend.onrender.com/api/v1/health`
   - **Monitoring Interval**: `Every 5 minutes`
3. Click **Create Monitor**.
4. **Done!** UptimeRobot will ping your backend every 5 minutes, ensuring your server never sleeps and visitors experience instant load times 24/7.

---

## 🐳 Alternative: Self-Hosting on VPS (Single Command via Docker)

If you have a DigitalOcean droplet, AWS EC2, or Oracle Cloud Free VM:

1. Clone your repo onto the server:
   ```bash
   git clone https://github.com/<your-username>/Karigar-Platform.git
   cd Karigar-Platform
   ```
2. Start all services with Docker Compose:
   ```bash
   docker compose up -d --build
   ```
3. Your app is now running with PostgreSQL, Backend, and Nginx Frontend!
