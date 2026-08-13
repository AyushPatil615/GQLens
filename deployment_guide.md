# GraphScope Distributed Deployment Guide
## Vercel + Supabase + Railway / Render

This guide walks you through deploying GraphScope across 3 free cloud services:
1. **Supabase**: Cloud PostgreSQL Database
2. **Railway or Render**: Express + Apollo Server + SSE Backend
3. **Vercel**: React / Vite Frontend UI

---

## 🟢 Step 1: Create Free Supabase Database

1. Go to [supabase.com](https://supabase.com) and create a free account.
2. Click **New Project**:
   - Project Name: `graphscope-db`
   - Database Password: *(Save this password!)*
   - Region: Select nearest location.
3. Once created, go to **Project Settings → Database → Connection String**:
   - Select **URI** tab or **Transaction Pooler**.
   - Copy your connection string (e.g. `postgres://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`).
4. **Seed the database**:
   - In your local project terminal, set the environment variable and run:
     ```bash
     cd server
     DATABASE_URL="your-supabase-connection-string-here" npm run seed:postgres
     ```
   - You will see: `✅ Supabase PostgreSQL Database successfully created and seeded!`
   - Go to Supabase **Table Editor** to visually inspect your `students`, `courses`, `enrollments`, `patients`, `appointments`, and `doctors` tables!

---

## 🟡 Step 2: Deploy Backend to Railway or Render

### Option A: Railway (Recommended - No Sleep on Free Credit)

1. Go to [railway.app](https://railway.app) and click **New Project → Deploy from GitHub repo**.
2. Select your `AyushPatil615/GraphQL` repo.
3. Set **Root Directory** to `server`.
4. Go to **Variables** tab and add:
   - `DATABASE_URL`: *(Your Supabase connection string)*
   - `CLIENT_ORIGIN`: *(Your Vercel URL, e.g. `https://graphscope.vercel.app`)*
5. Go to **Settings → Networking → Generate Domain** (e.g. `https://graphscope-server.up.railway.app`).

---

### Option B: Render (Alternative Free Hosting)

1. Go to [render.com](https://render.com) and click **New → Web Service**.
2. Connect your `AyushPatil615/GraphQL` GitHub repo.
3. Set configuration:
   - **Root Directory**: `server`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Add **Environment Variables**:
   - `DATABASE_URL`: *(Your Supabase connection string)*
   - `CLIENT_ORIGIN`: *(Your Vercel URL)*
5. Click **Create Web Service** and copy your backend URL (e.g. `https://graphscope-api.onrender.com`).

---

## 🔵 Step 3: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and click **Add New → Project**.
2. Import your `AyushPatil615/GraphQL` GitHub repository.
3. Set configuration:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
4. Under **Environment Variables**, add:
   - Key: `VITE_API_URL`
   - Value: *(Your Railway/Render backend URL from Step 2, e.g. `https://graphscope-server.up.railway.app`)*
5. Click **Deploy**!

---

## 🎯 Verification Checklist

- [ ] `https://your-backend.railway.app/health` returns `{"status":"ok","message":"GraphScope server running"}`.
- [ ] `https://your-app.vercel.app` loads the cream neobrutalism landing page.
- [ ] Running queries on the **✨ Solution** tab triggers live SSE timeline bars.
- [ ] Running the **⚡ N+1 Visualizer** streams live DB queries from Supabase Postgres!
