# DSAForge — Complete Hosting Guide + Marketing Content

---

# PART 1: HOSTING GUIDE (Step by Step)

---

## OPTION A: Render.com (FREE — Recommended for first launch)

Render gives you free PostgreSQL, free backend, free frontend. Zero cost to start.

---

### STEP 1 — Push your code to GitHub

```bash
# On your local machine, inside the dsaforge folder
cd dsaforge

git init
git add .
git commit -m "initial commit"

# Create a new repo on github.com (call it dsaforge)
# Then run:
git remote add origin https://github.com/YOUR_USERNAME/dsaforge.git
git branch -M main
git push -u origin main
```

---

### STEP 2 — Create PostgreSQL Database on Render

1. Go to https://render.com → Sign up (free)
2. Click **New +** → **PostgreSQL**
3. Fill in:
   - Name: `dsaforge-db`
   - Plan: **Free**
4. Click **Create Database**
5. Wait ~2 minutes. Then copy the **Internal Database URL** — looks like:
   ```
   postgresql://dsaforge_user:PASSWORD@dpg-xxx.oregon-postgres.render.com/dsaforge_db
   ```
   Save this. You will need it in Step 3.

---

### STEP 3 — Deploy Backend (Python FastAPI)

1. Click **New +** → **Web Service**
2. Connect your GitHub repo → select `dsaforge`
3. Fill in:
   - **Name:** `dsaforge-backend`
   - **Root Directory:** `backend`
   - **Environment:** `Python 3`
   - **Build Command:**
     ```
     pip install -r requirements.txt
     ```
   - **Start Command:**
     ```
     uvicorn main:app --host 0.0.0.0 --port $PORT
     ```
   - **Plan:** Free
4. Scroll to **Environment Variables** → Add these:
   ```
   DATABASE_URL = postgresql://dsaforge_user:PASSWORD@dpg-xxx.render.com/dsaforge_db
   SECRET_KEY   = any-long-random-string-like-dsaforge2024xyzabc123
   ```
   (Paste the DATABASE_URL you copied in Step 2)
5. Click **Create Web Service**
6. Wait ~3-5 minutes for build. You will get a URL like:
   ```
   https://dsaforge-backend.onrender.com
   ```
   Save this.

---

### STEP 4 — Update Frontend to point to your backend

Open `dsaforge/frontend/vite.config.js` and change:
```js
// Change this line:
target: 'http://localhost:8000',
// To your Render backend URL:
target: 'https://dsaforge-backend.onrender.com',
```

Also open `dsaforge/frontend/src/utils/api.js` and change:
```js
// Change:
const api = axios.create({ baseURL: '/api' })
// To:
const api = axios.create({ baseURL: 'https://dsaforge-backend.onrender.com/api' })
```

Commit and push:
```bash
git add .
git commit -m "point frontend to render backend"
git push
```

---

### STEP 5 — Deploy Frontend (React)

1. Click **New +** → **Static Site**
2. Connect same GitHub repo
3. Fill in:
   - **Name:** `dsaforge-frontend`
   - **Root Directory:** `frontend`
   - **Build Command:**
     ```
     npm install && npm run build
     ```
   - **Publish Directory:** `dist`
4. Click **Create Static Site**
5. Wait ~3 minutes. You get:
   ```
   https://dsaforge-frontend.onrender.com
   ```

**Your app is live.** Share that link.

---

### STEP 6 — Get a free custom domain (optional)

1. Go to https://www.freenom.com → get a free `.tk` or `.ml` domain
   OR buy a `.com` on GoDaddy for ₹799/year (~$10)
2. In Render → your frontend → **Custom Domains** → add your domain
3. Follow the DNS instructions Render shows you

---

## OPTION B: VPS on DigitalOcean/Hetzner (₹500/month, more control)

Best if you want everything on one server and expect real users.

---

### STEP 1 — Get a server

**DigitalOcean:** https://digitalocean.com
- Create a **Droplet** → Ubuntu 22.04 → Basic → **$6/month** (1GB RAM)
- Add your SSH key during setup

**Hetzner (cheaper, Europe):** https://hetzner.com/cloud
- CX11 → Ubuntu 22.04 → **€3.79/month**

---

### STEP 2 — Connect to your server

```bash
# From your local machine:
ssh root@YOUR_SERVER_IP
```

---

### STEP 3 — Install everything on the server

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

# Install Docker Compose
apt install docker-compose -y

# Install Nginx (for routing traffic)
apt install nginx -y

# Install Certbot (for free HTTPS)
apt install certbot python3-certbot-nginx -y
```

---

### STEP 4 — Upload your project to server

```bash
# From your LOCAL machine (not the server):
scp -r ./dsaforge root@YOUR_SERVER_IP:/opt/dsaforge
```

OR use Git on the server:
```bash
# On the server:
apt install git -y
git clone https://github.com/YOUR_USERNAME/dsaforge.git /opt/dsaforge
```

---

### STEP 5 — Set your secret key

```bash
cd /opt/dsaforge/backend
cp .env.example .env
nano .env
```

Change these two lines:
```
DATABASE_URL=postgresql://postgres:CHANGE_THIS_PASSWORD@db:5432/dsaforge
SECRET_KEY=CHANGE_THIS_TO_SOMETHING_RANDOM_LIKE_dsaforge2024abc123xyz
```

Also update `docker-compose.yml` — change the postgres password to match:
```yaml
POSTGRES_PASSWORD: CHANGE_THIS_PASSWORD
```

---

### STEP 6 — Build and start everything

```bash
cd /opt/dsaforge
docker-compose up -d --build
```

Wait 3-5 minutes. Check status:
```bash
docker-compose ps
# All 3 should show "Up"
```

Test backend:
```bash
curl http://localhost:8000
# Should return: {"message":"DSAForge API running"}
```

---

### STEP 7 — Configure Nginx (so users go to port 80, not 5173)

```bash
nano /etc/nginx/sites-available/dsaforge
```

Paste this (replace YOUR_DOMAIN with your actual domain or server IP):
```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN;

    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Enable it:
```bash
ln -s /etc/nginx/sites-available/dsaforge /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

### STEP 8 — Get free HTTPS (SSL certificate)

```bash
certbot --nginx -d YOUR_DOMAIN
# Follow prompts, select "Redirect HTTP to HTTPS"
```

Your site is now live at `https://YOUR_DOMAIN` with a valid SSL certificate.

---

### STEP 9 — Set up auto-restart and auto-renew

```bash
# Auto-restart docker on server reboot
systemctl enable docker

# SSL auto-renew (certbot does this automatically, but verify):
certbot renew --dry-run

# Set docker-compose to restart on reboot:
crontab -e
# Add this line:
@reboot cd /opt/dsaforge && docker-compose up -d
```

---

### STEP 10 — Updating the app in the future

```bash
cd /opt/dsaforge
git pull origin main
docker-compose down
docker-compose up -d --build
```

---

## OPTION C: Run locally for yourself only (simplest)

No server needed. Just for personal use.

```bash
# Install Docker Desktop from https://docker.com/products/docker-desktop

# Download and unzip dsaforge.zip
# Open terminal in the dsaforge folder

docker-compose up --build
# Wait 3-5 minutes

# Open browser:
# App: http://localhost:5173
# API docs: http://localhost:8000/docs
```

To stop:
```bash
docker-compose down
```

---

## COST SUMMARY

| Option | Cost | Best For |
|--------|------|----------|
| Render.com free tier | ₹0/month | Testing, first 100 users |
| DigitalOcean $6/month | ~₹500/month | Real launch, 1000+ users |
| Hetzner €3.79/month | ~₹340/month | Budget-conscious, EU |
| Local only | ₹0 | Personal use only |

---

---

# PART 2: REDDIT POST

*Post this to: r/cscareerquestions, r/developersIndia, r/learnprogramming, r/india*

---

**Title:**
**I built a free DSA prep tracker that tells you exactly which companies you can crack right now — based on your actual progress, not just what level you selected**

---

Hey everyone,

I've been grinding LeetCode for the past few months trying to switch companies, and I kept running into the same problem — I'd solve 50 random problems and still have no idea if I was actually ready for Amazon or just wasting time.

So I built **DSAForge** — a full open-source DSA prep tracker. Here's what makes it different from just using a LeetCode list:

**The core idea:**
Instead of showing you a static list of 150 questions, it tracks HOW you're solving them and tells you where you actually stand.

**What it does:**

🧮 **Internal adaptive algorithm** (no AI needed) — calculates a mastery score per topic using 4 factors: solve rate, how much of the topic you've covered, your average solving speed, and consistency across your last 5 attempts. Score < 50 = weak, 50-75 = learning, 75+ = strong.

🏢 **Company unlock system** — starts at 0 companies. As you build mastery in topics like Arrays, Trees, Graphs, companies start appearing in "you can clear now." FAANG requires 65+ avg mastery on their focus topics. Indian unicorns (Zomato, Swiggy, CRED, PhonePe etc.) have lower thresholds. Each company shows which topics they focus on most.

🔒 **Level progression** — Intermediate and Advanced levels are locked. They unlock only when you hit 20 solved + 60% success rate. Forces you to actually build a foundation before moving on.

⏱️ **Question timer** — starts automatically when you click a LeetCode link, saves how long you took. This feeds into your speed score.

🤖 **Optional AI** — if you have a Claude/ChatGPT/Gemini API key you can connect it. It enhances the batch feedback with personalized advice. But the entire system works without any AI API.

**The question bank** covers 90 LeetCode problems across 3 levels, tagged by company. Beginner: Arrays, Strings, Linked Lists. Intermediate: Graphs, DP, Sliding Window, Heaps. Advanced: Hard DP, Backtracking, Trie, Design, Complex Graphs.

**Tech stack:** React frontend, Python FastAPI backend, PostgreSQL. Fully open source.

I'm using this myself to prep for my next switch. Happy to answer questions or take feedback.

GitHub: [your link here]
Live demo: [your link here]

---

---

# PART 3: TELEGRAM POST

*Post this to: DSA prep groups, placement prep groups, college coding groups*

---

**🔥 Free DSA Prep Tool — Tracks which companies you can clear right now**

Hey everyone 👋

Built something I wish existed when I started DSA prep.

**DSAForge** — tracks your prep and tells you which companies you can actually crack based on your performance. Not just which level you manually set.

**How it works:**
→ Solve LeetCode questions inside the tracker
→ Internal algorithm scores each topic (0-100) based on your solve rate, coverage, speed, and consistency
→ Companies appear in "can clear now" only when your scores hit their thresholds
→ FAANG needs 65+ mastery on focus topics, Indian companies need 35-55
→ Weak topics auto-sorted to top so you fix gaps first

**90 questions** covering all major DSA topics. Company tags on every question (Amazon, Google, Flipkart, Zomato, etc.)

**Works without any AI API** — the algorithm runs internally. Optional: connect Claude/GPT/Gemini key for enhanced feedback.

**Free. Open source. No ads.**

🔗 [your link]

---

Drop your feedback below. I'm actively using this myself for interview prep and will keep improving it.

---

---

# PART 4: WHATSAPP/COLLEGE GROUP MESSAGE

*Short version for WhatsApp forwards*

---

Hey! Built a free DSA prep tracker for placements and job switches 🚀

**DSAForge** — tells you exactly which companies (Amazon, Google, Zomato, CRED etc.) you can clear based on how you're actually solving problems. Starts at 0 companies and unlocks them as you build real mastery.

✅ 90 LeetCode questions with company tags
✅ Score per topic — solve rate, speed, consistency
✅ Levels unlock only when you're actually ready
✅ Works without any paid AI subscription
✅ Free and open source

Perfect for: final year students, freshers, 1-3 year experience devs looking to switch.

Link: [your link]

---

---

# PART 5: IF YOU WANT TO MONETIZE (future)

Here is a simple model if this takes off:

**Free tier (keep forever free):**
- All 90 questions
- Full adaptive algorithm
- Company tracker
- Basic progress tracking

**Pro tier (₹199/month or ₹999/year):**
- Connect your own AI API for enhanced feedback
- 200+ question bank (expanded)
- Mock interview mode with time pressure
- Resume skill gap analyzer (enter job description → get question set)
- Priority company targeting (pick a company → get tailored question path)
- Export progress report as PDF

**Why this model works:**
- Free tier is genuinely useful → organic word of mouth in colleges
- Students preparing for placements have a clear payment moment (when offer season starts)
- ₹199/month is less than one prep book
- You already use it yourself → you know exactly what features matter

**Where to post for reach:**
- r/cscareerquestions (English, global)
- r/developersIndia (Indian dev community)
- r/btech (Indian students)
- LinkedIn post with your own switch story
- Telegram: @placement_prep groups, college DSA groups
- Twitter/X: tag @leetcode @gfg and post your build story
- Show HN on Hacker News (title: "Show HN: DSA prep tracker that shows which companies you can clear")

---
