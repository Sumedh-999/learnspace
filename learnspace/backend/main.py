from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

from routers import chat, assignments, grades, courses, quizzes, announcements, discussions, calendar
from db.database import create_tables

@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_tables()
    yield

app = FastAPI(
    title="LearnSpace API",
    description="AI-powered LMS backend",
    version="1.0.0",
    lifespan=lifespan
)

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(assignments.router, prefix="/api/assignments", tags=["assignments"])
app.include_router(grades.router, prefix="/api/grades", tags=["grades"])
app.include_router(courses.router, prefix="/api/courses", tags=["courses"])
app.include_router(quizzes.router, prefix="/api/quizzes", tags=["quizzes"])
app.include_router(announcements.router, prefix="/api/announcements", tags=["announcements"])
app.include_router(discussions.router, prefix="/api/discussions", tags=["discussions"])
app.include_router(calendar.router, prefix="/api/calendar", tags=["calendar"])

@app.get("/")
async def root():
    return {"status": "LearnSpace API is running"}

@app.get("/health")
async def health():
    return {"status": "ok"}
