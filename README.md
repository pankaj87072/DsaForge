# ⚡ DSAForge

> Forge your DSA skills. Switch companies. Level up.

A full-stack DSA preparation platform with AI-powered evaluation, adaptive question sets, and company-level targeting.

---

## 🏗️ Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React + Vite + Tailwind CSS |
| Backend | Python + FastAPI |
| Database | PostgreSQL |
| AI Connectors | Claude, OpenAI, Gemini (generic, extensible) |

---

## 🚀 Quick Start

### Option A: Docker (Recommended)

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Option B: Manual Setup

**1. Start PostgreSQL**
```bash
# Create database
createdb dsaforge
```

**2. Backend**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # Edit with your DB URL
uvicorn main:app --reload
```

**3. Frontend**
```bash
cd frontend
npm install
npm run dev
```

---

## 📱 User Flow

### 1. Register / Login
- Create account with username + password
- JWT token-based auth (30-day expiry)

### 2. Onboarding
**Step 1 — AI Connection (Skippable)**
- Connect Claude / ChatGPT / Gemini API key
- Token is SHA-256 hashed before storage
- Connection verified in real-time

**Step 2 — Skill Assessment**
- *With AI:* 10-question quiz → AI evaluates → assigns level
- *Without AI:* Self-select level + describe your background

### 3. Practice
- 30 questions per level (90 total)
- Locked levels unlock based on performance:
  - Intermediate: 20 beginner solved + 60% rate
  - Advanced: 20 intermediate solved + 65% rate
- Every 10 questions: batch feedback (AI or heuristic)
- Timer per question (starts when you open LeetCode link)

### 4. Company Insights
- See which companies you can clear at your current level
- 50+ companies across FAANG, Indian unicorns, global tier-2

---

## 🔧 Adding a New AI Provider

Only edit one file: `backend/services/ai_connector.py`

```python
AI_PROVIDERS["mistral"] = {
    "name": "Mistral AI",
    "verify_url": "https://api.mistral.ai/v1/chat/completions",
    "verify_method": "POST",
    "auth_header": "Authorization",
    "auth_prefix": "Bearer ",
    "verify_payload": {"model": "mistral-tiny", "max_tokens": 10, "messages": [{"role":"user","content":"hi"}]},
    "success_status": [200],
    "headers": {},
    "chat_handler": "mistral_chat"
}
```

Then add a `_mistral_chat(token, prompt, system)` handler. That's it — no other code changes needed.

---

## 📊 Database Schema

```
users              → core user info, level, onboarding state
ai_connections     → hashed API tokens by provider
evaluation_results → quiz scores, AI assessments
user_progress      → per-question solve status + timing
level_progress     → solved counts, unlock flags
user_inputs        → all text inputs (for future analysis)
```

---

## 🏢 Companies Database

Located in `backend/data/companies.py` — plain Python file, no DB needed.
Covers 50+ companies in 4 tiers:
- FAANG (Google, Meta, Amazon, Apple, Microsoft, Netflix)
- Top tech (Uber, Airbnb, Stripe, Shopify, etc.)
- Global tier-2 (Oracle, Atlassian, Coinbase, etc.)
- India (Flipkart, Zomato, Swiggy, CRED, PhonePe, etc.)

---

## ❓ Questions Bank

Located in `backend/data/questions.py` — 90 curated LeetCode questions:
- **Beginner (30):** Arrays, Strings, Linked Lists, Basic Trees, Math
- **Intermediate (30):** Two Pointers, Sliding Window, Graphs, DP, Heaps, Stacks
- **Advanced (30):** Hard DP, Complex Graphs, Backtracking, Trie, Design

Each question tagged with: difficulty, topic, LeetCode ID, company tags.

---

## 🔐 Security Notes

- Passwords: bcrypt hashed
- API tokens: SHA-256 hashed before DB storage
- In-memory token cache for API calls (use Redis in production)
- JWTs with 30-day expiry
- For production: use a secrets manager (AWS KMS, HashiCorp Vault) for token storage

---

## 📁 Project Structure

```
dsaforge/
├── backend/
│   ├── main.py              # FastAPI app
│   ├── database.py          # SQLAlchemy setup
│   ├── models/              # DB models
│   ├── routers/             # API routes
│   ├── services/
│   │   └── ai_connector.py  # ← ADD NEW AI TOOLS HERE
│   └── data/
│       ├── questions.py     # 90 DSA questions
│       └── companies.py     # 50+ companies
└── frontend/
    └── src/
        ├── pages/           # LoginPage, RegisterPage, OnboardingPage, DashboardPage, PracticePage
        ├── components/      # AIConnectionStep, EvaluationStep
        ├── hooks/           # useAuth
        └── utils/           # api.js (axios instance)
```
