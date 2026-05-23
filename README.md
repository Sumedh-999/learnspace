# LearnSpace LMS

A full-stack AI-powered Learning Management System clone with an intelligent student chatbot assistant.

**Stack:** React · FastAPI · PostgreSQL · Claude AI · Vercel · Render · Supabase

---

## Project Structure

```
learnspace/
├── frontend/          # React app → deploys to Vercel
├── backend/           # FastAPI app → deploys to Render
├── docker-compose.yml # Local development
└── README.md
```

---

## Local Development

### Prerequisites
- Node.js 18+
- Python 3.11+
- Docker (optional)

### 1. Clone and setup

```bash
git clone https://github.com/YOUR_USERNAME/learnspace.git
cd learnspace
```

### 2. Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # Fill in your keys
uvicorn main:app --reload --port 8000
```

### 3. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env.local      # Fill in backend URL
npm run dev
```

### 4. Or run everything with Docker

```bash
docker-compose up --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## Production Deployment

### Step 1 — Supabase (Database)

1. Go to https://supabase.com → New project
2. Copy your **Database URL** from Settings → Database
3. Run the schema: paste contents of `backend/db/schema.sql` in the SQL editor

### Step 2 — Render (Backend)

1. Go to https://render.com → New Web Service
2. Connect your GitHub repo
3. Set:
   - **Root directory:** `backend`
   - **Build command:** `pip install -r requirements.txt`
   - **Start command:** `uvicorn main:app --host 0.0.0.0 --port 8000`
4. Add environment variables:
   - `ANTHROPIC_API_KEY` = your key from https://console.anthropic.com
   - `DATABASE_URL` = your Supabase connection string
   - `FRONTEND_URL` = your Vercel URL (add after step 3)
5. Deploy → copy your Render URL (e.g. `https://learnspace-api.onrender.com`)

### Step 3 — Vercel (Frontend)

1. Go to https://vercel.com → New Project
2. Import your GitHub repo
3. Set **Root Directory** to `frontend`
4. Add environment variable:
   - `VITE_API_URL` = your Render backend URL
5. Deploy → your app is live!

---

## Environment Variables

### Backend (`backend/.env`)
```
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=postgresql://user:pass@host:5432/learnspace
FRONTEND_URL=https://your-app.vercel.app
```

### Frontend (`frontend/.env.local`)
```
VITE_API_URL=http://localhost:8000
```

---

## Features

- 7 LMS modules: Dashboard, Courses, Assignments, Quizzes, Grades, Discussions, Announcements, Calendar
- AI chatbot powered by Claude with real student data context
- Streaming chat responses
- PostgreSQL-backed student data
- JWT authentication ready
- CORS configured for Vercel ↔ Render
