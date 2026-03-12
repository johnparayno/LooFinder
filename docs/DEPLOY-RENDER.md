# Deploy LooFinder to Render.com

Step-by-step guide to deploy LooFinder on [Render.com](https://render.com) (free tier).

---

## Prerequisites

- [GitHub](https://github.com) account
- [Render](https://render.com) account (free)
- LooFinder repo pushed to GitHub

---

## Step 1: Push your code to GitHub

If your project isn’t on GitHub yet:

```bash
cd /Users/johnparayno/LooFinder
git remote add origin https://github.com/YOUR_USERNAME/LooFinder.git   # if not already added
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username. Use `master` instead of `main` if that’s your default branch.

---

## Step 2: Create a Render account

1. Go to [render.com](https://render.com)
2. Click **Get Started**
3. Sign up with **GitHub** (recommended so Render can access your repos)

---

## Step 3: Create a new Web Service

1. In the [Render Dashboard](https://dashboard.render.com), click **New +** → **Web Service**
2. Connect your GitHub account if asked
3. Find **LooFinder** and click **Connect**
4. If the repo doesn’t appear, click **Configure account** and grant access to the right org/user

---

## Step 4: Configure the Web Service

Use these settings:

| Field | Value |
|-------|--------|
| **Name** | `loofinder` (or any name) |
| **Region** | Frankfurt (EU) or Oregon (US) |
| **Branch** | `main` (or your default branch) |
| **Root Directory** | *(leave empty – deploy from repo root)* |
| **Runtime** | `Node` |
| **Build Command** | See below |
| **Start Command** | See below |

### Build Command

```bash
cd backend && npm install && npm run build && npm run seed && cd ../frontend && npm install && npm run build
```

This will:

1. Install backend deps and build TypeScript
2. Seed the database
3. Install frontend deps and build the React app

### Start Command

```bash
cd backend && NODE_ENV=production npm start
```

---

## Step 5: Environment variables

1. Open the **Environment** section
2. Add:

| Key | Value |
|-----|--------|
| `NODE_ENV` | `production` |

Optional:

| Key | Value |
|-----|--------|
| `DATABASE_PATH` | `./data/loofinder.db` (default) |

---

## Step 6: Deploy

1. Click **Create Web Service**
2. Render will build and deploy
3. First deploy can take 3–5 minutes
4. When it’s done, your app will be at `https://loofinder.onrender.com` (or the URL shown)

---

## Step 7: Point parayno.dk to Render (optional)

To use `parayno.dk` or `loofinder.parayno.dk`:

1. In Render: **Settings** → **Custom Domains** → **Add Custom Domain**
2. Enter `loofinder.parayno.dk` (or `parayno.dk`)
3. Render will show DNS records
4. In Gigahost (or your DNS provider), add a **CNAME** record:
   - **Name:** `loofinder` (for `loofinder.parayno.dk`) or `@` (for root)
   - **Value:** `loofinder.onrender.com` (your Render URL)
5. Wait for DNS propagation (up to 48 hours, often minutes)
6. Render will issue an SSL certificate automatically

---

## Notes

### Free tier limits

- Service sleeps after ~15 minutes of no traffic
- First request after sleep can take 30–60 seconds (cold start)
- 750 free hours per month

### SQLite and data

- On the free tier, the filesystem is ephemeral
- Data can be lost on restarts or redeploys
- The seed runs on each deploy, so you always get fresh toilet data
- For persistent data, use a paid plan with a [Persistent Disk](https://render.com/docs/disks) or switch to PostgreSQL

### Automatic deploys

- Every push to the connected branch triggers a new deploy
- To disable: **Settings** → **Build & Deploy** → turn off **Auto-Deploy**

---

## Troubleshooting

| Issue | What to try |
|-------|-------------|
| Build fails | Check **Logs** in Render for errors. Often `npm install` or `npm run build` issues. |
| Blank page | Ensure `NODE_ENV=production` is set so the backend serves the frontend. |
| 502 Bad Gateway | Service may be starting. Wait 1–2 minutes and retry. |
| Cold start slow | Normal on free tier. First request after sleep is slow. |

---

## Summary

1. Push code to GitHub  
2. Create Render account and connect GitHub  
3. New Web Service → connect LooFinder repo  
4. Use the build and start commands above  
5. Add `NODE_ENV=production`  
6. Deploy and use the Render URL  
7. (Optional) Add custom domain in Render and DNS
