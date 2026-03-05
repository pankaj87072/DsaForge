# ⚡ DSAForge — Complete Product Documentation

> Full-stack DSA preparation platform | React + Python FastAPI + PostgreSQL

---

## ✅ IMPLEMENTATION AUDIT — What Is & Isn't Built

| Feature You Specified | Status | Where |
|---|---|---|
| Login / Register flow | ✅ Done | `routers/auth.py`, `pages/LoginPage.jsx`, `pages/RegisterPage.jsx` |
| Generic AI connector (add future tools with 1 change) | ✅ Done | `services/ai_connector.py` |
| AI connection with loading state | ✅ Done | `components/onboarding/AIConnectionStep.jsx` |
| Connection success / failure display | ✅ Done | `AIConnectionStep.jsx` (3 states: connecting → success/error) |
| Skippable AI connection | ✅ Done | Skip button in `AIConnectionStep.jsx` |
| AI-powered quiz to evaluate level | ✅ Done | `routers/evaluation.py` + `EvaluationStep.jsx` |
| Text area self-description (no API path) | ✅ Done | `EvaluationStep.jsx` self-report mode |
| Self-description saved to DB for future use | ✅ Done | `user_inputs` table, `routers/users.py` |
| Level assignment: beginner / intermediate / advanced | ✅ Done | `evaluation.py`, `models/user.py` |
| Static question bank stored in file (no DB) | ✅ Done | `data/questions.py` — 90 questions |
| Question bank size 150-200 | ⚠️ Partial | Currently 90 (30×3). Needs expansion to 150+ |
| Levels locked until performance threshold | ✅ Done | `routers/progress.py` `_check_unlock()` |
| Performance thresholds (solved count + rate) | ✅ Done | `data/companies.py` `LEVEL_UNLOCK_REQUIREMENTS` |
| Batch feedback every 10 questions | ✅ Done | `_generate_batch_feedback()` in `progress.py` |
| AI weakness detection (with API) | ✅ Done | AI prompt with topic_stats in `_generate_batch_feedback()` |
| Internal weakness calc without AI | ✅ Done | Heuristic fallback: failed > solved → weakness |
| Question shifting based on weakness | ⚠️ Partial | Weakness detected but topic-filter UI exists; auto-reordering not implemented |
| AI API hit minimum (free tier protection) | ✅ Done | API called only at: evaluation (once) + every 10 questions |
| Hardcoded company list in file | ✅ Done | `data/companies.py` — 52 companies |
| Companies shown based on user level | ✅ Done | `get_clearable_companies()` + dashboard display |
| All user inputs stored in DB | ✅ Done | `user_inputs` table captures all text inputs |
| Timing per question tracked | ✅ Done | Timer in `PracticePage.jsx`, stored via `/progress/submit` |
| Token hashed before storage | ✅ Done | SHA-256 hash in `routers/ai_connections.py` |
| Docker support | ✅ Done | `docker-compose.yml` + both Dockerfiles |

**Summary:** 21/23 features fully implemented. 2 partial (question count = 90 not 150, weakness auto-reorder = UI filter exists but not auto).

---

## 🗺️ FULL USER FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│                        USER VISITS APP                       │
└────────────────────────────┬────────────────────────────────┘
                             │
              ┌──────────────▼──────────────┐
              │      Has account?           │
              └──────┬──────────────┬───────┘
                     │ NO           │ YES
                     ▼             ▼
              ┌──────────┐   ┌──────────┐
              │ REGISTER │   │  LOGIN   │
              │ username │   │ username │
              │ password │   │ password │
              └────┬─────┘   └────┬─────┘
                   │              │
                   └──────┬───────┘
                          │ JWT Token issued
                          ▼
         ┌────────────────────────────────┐
         │         ONBOARDING             │
         │        (2 steps)               │
         └────────────┬───────────────────┘
                      │
         ┌────────────▼───────────────────┐
         │   STEP 1: AI CONNECTION        │
         │                                │
         │  Choose provider:              │
         │  [Claude] [ChatGPT] [Gemini]   │
         │                                │
         │  Enter API token               │
         │  → [Connect] or [Skip]         │
         └──────┬─────────────┬───────────┘
                │ Connect      │ Skip
                ▼             ▼
    ┌───────────────┐    ┌────────────────┐
    │ CONNECTING... │    │ ai_connected   │
    │ (spinner)     │    │ = false        │
    └──────┬────────┘    └───────┬────────┘
           │                     │
    ┌──────▼──────┐              │
    │ SUCCESS ✅  │              │
    │ or ERROR ❌ │              │
    └──────┬──────┘              │
           │                     │
           └──────────┬──────────┘
                      │
         ┌────────────▼───────────────────┐
         │   STEP 2: SKILL ASSESSMENT     │
         └──────────┬─────────────────────┘
                    │
         ┌──────────▼──────────┐
         │  AI connected?      │
         └───┬─────────────────┘
             │ YES              │ NO
             ▼                 ▼
    ┌────────────────┐  ┌────────────────────┐
    │ QUIZ MODE      │  │ SELF-REPORT MODE   │
    │ 10 questions   │  │                    │
    │ AI evaluates   │  │ Select level:      │
    │ answers        │  │ [Beginner]         │
    │ + description  │  │ [Intermediate]     │
    │                │  │ [Advanced]         │
    │ AI assigns     │  │                    │
    │ level via API  │  │ Text area:         │
    │                │  │ "Describe your DSA │
    │                │  │ knowledge..."      │
    └───────┬────────┘  └────────┬───────────┘
            │                    │
            │ Both paths: level assigned, saved to DB
            │
            ▼
    ┌───────────────────────────────────────┐
    │            DASHBOARD                  │
    │                                       │
    │  Stats: Solved / Level / Companies    │
    │                                       │
    │  ┌─────────┐ ┌───────────┐ ┌───────┐ │
    │  │Beginner │ │Intermediate│ │Advance│ │
    │  │ 🌱      │ │ ⚡ 🔒     │ │🔥 🔒 │ │
    │  │Unlocked │ │ Locked    │ │Locked │ │
    │  └────┬────┘ └───────────┘ └───────┘ │
    │       │                               │
    │  Companies you can crack now 🏢       │
    └───────┬───────────────────────────────┘
            │
            ▼
    ┌────────────────────────────────────────┐
    │          PRACTICE PAGE (/level)        │
    │                                        │
    │  Progress bar  [███░░░░░░░] 33%        │
    │  Topics filter [All][Arrays][Trees]... │
    │                                        │
    │  #1 Two Sum          [Tried] [Solved✓] │
    │     Easy · Arrays · #1 · Google Amazon │
    │     ⏱ 45s (timer from LC click)       │
    │                                        │
    │  #2 Valid Anagram    [Tried] [Solved✓] │
    │  ...                                   │
    └─────────────┬──────────────────────────┘
                  │ Every 10 solved
                  ▼
    ┌────────────────────────────────────────┐
    │         BATCH FEEDBACK MODAL           │
    │                                        │
    │  WITH AI:                              │
    │  → AI analyzes topic_stats, timing,    │
    │    attempts count                      │
    │  → Returns weaknesses + advice         │
    │                                        │
    │  WITHOUT AI (fallback):               │
    │  → Heuristic: failed > solved = weak   │
    │  → Shows topic name + generic advice   │
    └────────────────────────────────────────┘
                  │ After 20+ solved + 60%+ rate
                  ▼
    ┌────────────────────────────────────────┐
    │     🎉 NEXT LEVEL UNLOCKED!            │
    │     Dashboard updates lock icons       │
    │     New companies shown on dashboard   │
    └────────────────────────────────────────┘
```

---

## 📂 COMPLETE FILE MAP — Every File, Every Function

```
dsaforge/
│
├── docker-compose.yml          ← Start everything with one command
├── README_COMPLETE.md          ← This file
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── .env.example
│   │
│   ├── main.py                 ← FastAPI app entry point
│   │   └── startup()          ← Calls create_tables() on boot
│   │
│   ├── database.py             ← SQLAlchemy engine + session
│   │   ├── get_db()           ← FastAPI dependency for DB session
│   │   └── create_tables()    ← Auto-creates all tables
│   │
│   ├── models/
│   │   ├── __init__.py        ← Imports all models so create_tables works
│   │   │
│   │   ├── user.py            ← TABLE: users
│   │   │   └── User           id, username, password_hash, level,
│   │   │                       self_description, onboarding_complete,
│   │   │                       ai_connected, created_at, updated_at
│   │   │
│   │   ├── ai_connection.py   ← TABLE: ai_connections
│   │   │   └── AIConnection   id, user_id, provider, token_hash,
│   │   │                       token_preview, is_active, last_verified
│   │   │
│   │   └── progress.py        ← TABLES: evaluation_results,
│   │       ├── EvaluationResult    user_progress, level_progress,
│   │       ├── UserProgress        user_inputs
│   │       ├── LevelProgress
│   │       └── UserInput
│   │
│   ├── routers/
│   │   ├── auth.py            ← POST /api/auth/register
│   │   │   ├── register()         POST /api/auth/login
│   │   │   ├── login()
│   │   │   ├── create_token()  ← JWT generation (30-day expiry)
│   │   │   └── get_current_user() ← JWT decode → User object
│   │   │
│   │   ├── users.py           ← GET  /api/users/me
│   │   │   ├── get_me()            PUT  /api/users/level
│   │   │   ├── update_level()      PUT  /api/users/self-description
│   │   │   ├── save_description()  PUT  /api/users/complete-onboarding
│   │   │   └── complete_onboarding()
│   │   │
│   │   ├── ai_connections.py  ← GET  /api/ai/providers
│   │   │   ├── list_providers()    POST /api/ai/connect
│   │   │   ├── connect_ai()        GET  /api/ai/status
│   │   │   ├── connection_status() DELETE /api/ai/disconnect
│   │   │   ├── disconnect()
│   │   │   └── _token_cache{}  ← In-memory store of raw tokens
│   │   │       get_user_token()    (use Redis in production)
│   │   │
│   │   ├── evaluation.py      ← GET  /api/evaluation/quiz
│   │   │   ├── get_quiz()          POST /api/evaluation/submit-quiz
│   │   │   ├── submit_quiz()       POST /api/evaluation/self-report
│   │   │   ├── self_report()
│   │   │   └── _score_to_level() ← 70%+=advanced, 40%+=intermediate
│   │   │
│   │   ├── questions.py       ← GET  /api/questions/level/{level}
│   │   │   ├── get_questions()     GET  /api/questions/companies
│   │   │   ├── companies()         GET  /api/questions/clearable-companies
│   │   │   └── clearable()
│   │   │
│   │   └── progress.py        ← POST /api/progress/submit
│   │       ├── submit_progress()   GET  /api/progress/summary
│   │       ├── get_summary()
│   │       ├── _check_unlock()  ← Checks solved count + success rate
│   │       └── _generate_batch_feedback() ← AI or heuristic at 10,20,30
│   │
│   ├── services/
│   │   └── ai_connector.py    ← THE GENERIC AI HUB
│   │       │
│   │       ├── AI_PROVIDERS{}  ← Registry dict. Add new tool = add here only.
│   │       │   ├── "claude"   → verify_url, auth_header, verify_payload...
│   │       │   ├── "openai"   → verify_url, auth_header="Authorization"...
│   │       │   └── "gemini"   → verify_url, auth_query_param="key"...
│   │       │
│   │       ├── verify_connection(provider, token)
│   │       │   └── Generic: reads config from AI_PROVIDERS, builds
│   │       │       headers/params, makes POST, returns success/error
│   │       │
│   │       ├── chat_with_ai(provider, token, prompt, system)
│   │       │   └── Dispatcher: looks up chat_handler in AI_PROVIDERS
│   │       │       routes to _claude_chat / _openai_chat / _gemini_chat
│   │       │
│   │       ├── _claude_chat(token, prompt, system)
│   │       ├── _openai_chat(token, prompt, system)
│   │       ├── _gemini_chat(token, prompt, system)
│   │       └── get_providers_list() ← For frontend dropdown
│   │
│   └── data/                  ← STATIC FILES — no DB needed
│       ├── questions.py
│       │   ├── DSA_QUESTIONS{}       90 questions (30 per level)
│       │   │   ├── "beginner"[30]  → Arrays, Strings, Linked Lists,
│       │   │   │                      Trees, Math, Hashing, DP basics
│       │   │   ├── "intermediate"[30] → Two Pointers, Sliding Window,
│       │   │   │                        Graphs, DP, Heaps, Stacks
│       │   │   └── "advanced"[30]  → Hard DP, Backtracking, Trie,
│       │   │                          Design, Bit Manipulation
│       │   │
│       │   ├── EVALUATION_QUIZ[10]   10 quiz questions with correct answers
│       │   │                         tagged by level_indicator
│       │   ├── get_questions_by_level(level) → list
│       │   ├── get_quiz_questions() → list
│       │   └── get_question_by_id(qid) → dict
│       │
│       └── companies.py
│           ├── COMPANIES{}           52 companies in 4 tiers
│           │   ├── "tier1_faang"[6]  Google, Meta, Amazon, Apple,
│           │   │                      Microsoft, Netflix
│           │   ├── "tier1_other"[10] Uber, Airbnb, Twitter, LinkedIn,
│           │   │                      Stripe, Shopify, Snap, etc.
│           │   ├── "tier2"[18]       Oracle, IBM, Atlassian, Coinbase,
│           │   │                      DoorDash, Spotify, GitHub, etc.
│           │   └── "tier3_india"[18] Flipkart, Zomato, Swiggy, CRED,
│           │                          PhonePe, Razorpay, Dream11, etc.
│           │
│           ├── LEVEL_UNLOCK_REQUIREMENTS{}
│           │   ├── beginner→intermediate: 20 solved, 60% rate
│           │   └── intermediate→advanced: 20 solved, 65% rate
│           │
│           ├── get_clearable_companies(level, solved_topics) → list
│           │   └── Filters companies where user level >= company min_level
│           └── get_all_companies() → flat list with tier info
│
└── frontend/
    ├── index.html              ← Google Fonts: Space Grotesk + JetBrains Mono
    ├── vite.config.js          ← Dev proxy /api → localhost:8000
    ├── tailwind.config.js      ← forge-* custom colors, animations
    ├── package.json
    │
    └── src/
        ├── main.jsx            ← ReactDOM.createRoot
        ├── index.css           ← Global styles: .glass, .gradient-text,
        │                          .glow-*, noise-bg, animations
        │
        ├── App.jsx             ← Router with 3 route types:
        │   ├── ProtectedRoute  → redirects to /login if no token
        │   │                     redirects to /onboarding if not complete
        │   ├── OnboardingRoute → redirects to /dashboard if complete
        │   └── Routes:
        │       /login, /register, /onboarding, /dashboard, /practice/:level
        │
        ├── hooks/
        │   └── useAuth.jsx     ← React Context: user state
        │       ├── user         Current user object (from localStorage)
        │       ├── login(userData, token) → saves to localStorage
        │       ├── logout()     → clears localStorage, resets state
        │       └── updateUser(updates) → merges + saves
        │
        ├── utils/
        │   └── api.js          ← Axios instance
        │       ├── baseURL: '/api'
        │       ├── request interceptor → auto-attaches Bearer token
        │       └── response interceptor → 401 → clears auth → /login
        │
        ├── pages/
        │   ├── LoginPage.jsx
        │   │   └── handleSubmit() → POST /api/auth/login
        │   │                         → navigates to /dashboard or /onboarding
        │   │
        │   ├── RegisterPage.jsx
        │   │   └── handleSubmit() → POST /api/auth/register
        │   │                         → navigates to /onboarding
        │   │
        │   ├── OnboardingPage.jsx
        │   │   ├── step=0: <AIConnectionStep>
        │   │   ├── step=1: <EvaluationStep hasAI={...}>
        │   │   ├── handleAIConnected() → setAiConnected(true) → step=1
        │   │   ├── handleAISkipped()   → step=1 (ai=false)
        │   │   └── handleEvalComplete(level) → updateUser → /dashboard
        │   │
        │   ├── DashboardPage.jsx
        │   │   ├── Fetches: GET /progress/summary
        │   │   ├── Fetches: GET /questions/clearable-companies
        │   │   ├── Level cards (locked/unlocked) → navigate /practice/:level
        │   │   ├── Clearable companies grid (color-coded dots)
        │   │   └── Topic breakdown with solve rates
        │   │
        │   └── PracticePage.jsx
        │       ├── Fetches: GET /questions/level/:level
        │       ├── startTimer(qid)  → starts interval on LC link click
        │       ├── stopTimer(qid)   → returns elapsed seconds
        │       ├── markQuestion(q, status) → POST /progress/submit
        │       │   ├── Receives batch_feedback → shows modal at 10,20,30
        │       │   └── Receives unlock_info → shows notification
        │       ├── Filter: all / solved / unsolved
        │       ├── Topic pills filter
        │       └── Batch feedback modal (weakness + advice)
        │
        └── components/
            └── onboarding/
                ├── AIConnectionStep.jsx
                │   ├── Fetches: GET /api/ai/providers → dropdown
                │   ├── handleConnect() → POST /api/ai/connect
                │   │   Status states: idle → connecting → success/error
                │   │   Success: 1.5s delay → onComplete()
                │   └── Skip button → onSkip()
                │
                └── EvaluationStep.jsx
                    ├── mode=null: choice screen
                    │   (Quiz shown only if hasAI=true)
                    ├── mode='quiz':
                    │   ├── Fetches: GET /api/evaluation/quiz
                    │   ├── One question at a time with progress bar
                    │   ├── Optional description textarea
                    │   └── submitQuiz() → POST /evaluation/submit-quiz
                    └── mode='self':
                        ├── Level selector (3 buttons)
                        ├── Description textarea
                        └── submitSelf() → POST /evaluation/self-report
```

---

## 🔌 AI CONNECTOR — How the Generic System Works

This is the most important architectural piece. File: `backend/services/ai_connector.py`

### Adding a new AI provider (future)

**Only change needed — add one entry to `AI_PROVIDERS` dict:**

```python
AI_PROVIDERS["mistral"] = {
    "name": "Mistral AI",
    "verify_url": "https://api.mistral.ai/v1/chat/completions",
    "verify_method": "POST",
    "auth_header": "Authorization",
    "auth_prefix": "Bearer ",
    "verify_payload": {
        "model": "mistral-tiny",
        "max_tokens": 10,
        "messages": [{"role": "user", "content": "hi"}]
    },
    "success_status": [200],
    "headers": {},
    "chat_handler": "mistral_chat"
}

# Then add one handler function:
async def _mistral_chat(token: str, prompt: str, system: str) -> str:
    # ... call mistral API ...
```

**That's the only change. No router changes. No frontend changes. The provider auto-appears in the dropdown.**

### How verification works (generic flow):

```
POST /api/ai/connect  {provider: "claude", token: "sk-ant-..."}
         │
         ▼
verify_connection(provider, token)
         │
         ├── Read AI_PROVIDERS["claude"]
         ├── Build headers: {"x-api-key": token, "anthropic-version": "..."}
         ├── POST https://api.anthropic.com/v1/messages with tiny payload
         │
         ├── 200 → {"success": True}
         ├── 401 → {"success": False, "error": "Invalid API token"}
         ├── 429 → {"success": False, "error": "Rate limit — likely valid"}
         └── timeout → {"success": False, "error": "Connection timed out"}
         │
         ▼
If success:
  - SHA256 hash token → store in ai_connections table
  - Store raw token in _token_cache[user_id] (memory only)
  - user.ai_connected = True
```

### How AI chat works (generic dispatcher):

```
chat_with_ai(provider, token, prompt)
         │
         ├── Look up AI_PROVIDERS[provider]["chat_handler"]  → e.g. "claude_chat"
         ├── handlers = {"claude_chat": _claude_chat, "openai_chat": ..., ...}
         └── Call handler(token, prompt, system)
```

---

## 🧠 WEAKNESS DETECTION LOGIC

### With AI (called every 10 solved questions):

```python
# In progress.py → _generate_batch_feedback()

topic_stats = {
  "Arrays":  {"solved": 7, "failed": 1},
  "Trees":   {"solved": 1, "failed": 4},   ← WEAK
  "Graphs":  {"solved": 0, "failed": 3},   ← WEAK
}

prompt = f"""
DSA learner at {level} level. Topic performance: {topic_stats}.
Number of attempts, solve rate per topic considered.
Identify top 2 weak areas and give specific advice.
Format: {{"weaknesses": ["Trees","Graphs"], "advice": "..."}}
"""
# → sent to user's connected AI provider
# → returns weaknesses + personalized 3-sentence advice
```

**Parameters AI considers:** topic solve rate, failed count, level context.

### Without AI (heuristic fallback):

```python
weaknesses = [topic for topic, stats in topic_stats.items()
              if stats["failed"] > stats["solved"]]
# Simple rule: more failures than solves = weak topic
# Returns top 2 weak topics + generic advice string
```

---

## 📊 LEVEL UNLOCK LOGIC

```
User solving Beginner questions...
         │
         ├── Every solve → POST /progress/submit
         │                 → _check_unlock() runs
         │
         ├── Query: count solved WHERE level='beginner' AND status='solved'
         ├── Query: count attempted WHERE level='beginner'
         ├── success_rate = solved / total_attempted
         │
         ├── If solved >= 20 AND rate >= 0.60:
         │     LevelProgress.intermediate_unlocked = True
         │     Return {"unlocked": "intermediate", "message": "🎉 Intermediate unlocked!"}
         │
         └── Frontend shows toast notification + dashboard refreshes
```

---

## 🏢 COMPANY LIST LOGIC

```python
# data/companies.py — 52 companies, 4 tiers

# Each company has:
{
  "name": "Google",
  "min_level": "intermediate",   ← minimum user level to "crack" this
  "strong_topics": ["Graphs","DP","Arrays","Trees"],
  "logo_color": "#4285F4"        ← for UI color dot
}

# get_clearable_companies(user_level, solved_topics):
level_map = {"beginner": 0, "intermediate": 1, "advanced": 2}
# Returns all companies where user_level_num >= company_level_num

# Companies by level:
# beginner  (0) → TCS, Infosys, Wipro, HCL, Flipkart, Paytm, Nykaa...
# intermediate (1) → Amazon, Microsoft, Google, Meta, Zomato, Swiggy, CRED...
# advanced  (2) → Netflix, Palantir, Stripe, DataBricks...
```

---

## 🗄️ DATABASE SCHEMA

```sql
-- users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,       -- bcrypt
    level VARCHAR(20) DEFAULT 'beginner',
    self_description TEXT,
    onboarding_complete BOOLEAN DEFAULT false,
    ai_connected BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- ai_connections
CREATE TABLE ai_connections (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    provider VARCHAR(50) NOT NULL,             -- claude/openai/gemini
    token_hash VARCHAR(255) NOT NULL,          -- SHA-256, never plain text
    token_preview VARCHAR(20),                 -- "sk-a...k9xz" for display
    is_active BOOLEAN DEFAULT true,
    last_verified TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- evaluation_results
CREATE TABLE evaluation_results (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    method VARCHAR(20),                        -- "ai_quiz" or "self_report"
    raw_answers JSONB,                         -- all quiz answers
    self_description TEXT,                     -- user's own words
    ai_assessment TEXT,                        -- AI feedback text
    assigned_level VARCHAR(20),                -- beginner/intermediate/advanced
    score FLOAT,                               -- 0.0 to 1.0
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- user_progress (one row per question per user)
CREATE TABLE user_progress (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    question_id VARCHAR(50) NOT NULL,          -- "b001", "i015", "a030"
    level VARCHAR(20),
    topic VARCHAR(100),
    status VARCHAR(20),                        -- solved/attempted/skipped
    time_taken_seconds INT,                    -- from in-page timer
    attempts INT DEFAULT 1,
    solved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- level_progress (one row per user, aggregate counters)
CREATE TABLE level_progress (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) UNIQUE,
    beginner_solved INT DEFAULT 0,
    beginner_unlocked BOOLEAN DEFAULT true,
    intermediate_solved INT DEFAULT 0,
    intermediate_unlocked BOOLEAN DEFAULT false,
    advanced_solved INT DEFAULT 0,
    advanced_unlocked BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- user_inputs (every text input ever entered — for your analytics)
CREATE TABLE user_inputs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    input_type VARCHAR(50),    -- "self_description", "quiz_description", etc.
    content TEXT,
    metadata JSONB,            -- e.g., {"score": 0.7}
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🌐 API REFERENCE

```
AUTH
  POST   /api/auth/register         {username, password} → {token, user_id, username}
  POST   /api/auth/login            {username, password} → {token, user_id, ...}

USERS
  GET    /api/users/me              → full user profile
  PUT    /api/users/level           {level, self_description?}
  PUT    /api/users/self-description {text}
  PUT    /api/users/complete-onboarding

AI
  GET    /api/ai/providers          → [{id, name}, ...]
  POST   /api/ai/connect            {provider, token} → {success, preview?}
  GET    /api/ai/status             → {connected, provider?, preview?}
  DELETE /api/ai/disconnect

EVALUATION
  GET    /api/evaluation/quiz       → 10 quiz questions
  POST   /api/evaluation/submit-quiz {answers[], self_description?} → {level, score, feedback}
  POST   /api/evaluation/self-report {level, self_description?}

QUESTIONS
  GET    /api/questions/level/{level}            → {questions[], locked}
  GET    /api/questions/companies                → all 52 companies
  GET    /api/questions/clearable-companies      → companies user can crack

PROGRESS
  POST   /api/progress/submit       {question_id, level, topic, status, time_taken_seconds?}
                                    → {success, unlock_info?, batch_feedback?}
  GET    /api/progress/summary      → {level_progress, topics, total_solved}
```

---

## 🚀 HOW TO RUN

### Docker (One Command)

```bash
cd dsaforge
docker compose up --build
```

- Frontend → http://localhost:5173
- Backend API → http://localhost:8000
- API Swagger Docs → http://localhost:8000/docs

### Manual

```bash
# Terminal 1: Database (needs PostgreSQL installed)
createdb dsaforge

# Terminal 2: Backend
cd dsaforge/backend
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env           # Edit DATABASE_URL if needed
uvicorn main:app --reload --port 8000

# Terminal 3: Frontend
cd dsaforge/frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## ⚠️ KNOWN GAPS & WHAT TO ADD NEXT

| Gap | What to do |
|-----|------------|
| Question bank is 90, not 150-200 | Expand `data/questions.py` — add 60 more questions to each level array, same format |
| Weakness auto-reorder | In `PracticePage.jsx`, sort `filteredQuestions` by putting weak-topic questions first based on batch_feedback from last call |
| Token survives restart | Replace `_token_cache = {}` in `ai_connections.py` with Redis (`pip install redis`) |
| AI inserts new LeetCode questions | Add endpoint that calls AI with weakness + level, returns new question objects, saves to user-specific question_additions table |
| Production secrets | Replace `.env` with AWS KMS / HashiCorp Vault for token storage |

---

## 🔐 SECURITY DESIGN

```
Password → bcrypt hash → stored in users.password_hash
API Token → SHA-256 hash → stored in ai_connections.token_hash
         → raw token → _token_cache[user_id] (memory only, lost on restart)
JWT → 30-day expiry, HS256, SECRET_KEY from env
```

Never: plain text passwords, plain text API tokens in database.

---

*DSAForge — Built to help you switch companies. Use it, extend it, win with it.*
