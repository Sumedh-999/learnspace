CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    student_id TEXT UNIQUE NOT NULL,
    program TEXT,
    semester INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    instructor TEXT,
    schedule TEXT,
    color TEXT DEFAULT '#c8102e',
    progress INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS assignments (
    id SERIAL PRIMARY KEY,
    course_id INT REFERENCES courses(id),
    title TEXT NOT NULL,
    due_date DATE,
    points INT DEFAULT 100,
    status TEXT DEFAULT 'pending',
    score INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS grades (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(id),
    course_id INT REFERENCES courses(id),
    percentage NUMERIC(5,2),
    letter_grade TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quizzes (
    id SERIAL PRIMARY KEY,
    course_id INT REFERENCES courses(id),
    title TEXT NOT NULL,
    scheduled_date DATE,
    duration_mins INT DEFAULT 30,
    total_questions INT DEFAULT 20,
    total_points INT DEFAULT 100,
    status TEXT DEFAULT 'upcoming',
    score INT
);

CREATE TABLE IF NOT EXISTS announcements (
    id SERIAL PRIMARY KEY,
    course_id INT REFERENCES courses(id),
    title TEXT NOT NULL,
    body TEXT,
    audience TEXT DEFAULT 'all',
    posted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS discussions (
    id SERIAL PRIMARY KEY,
    course_id INT REFERENCES courses(id),
    author_name TEXT NOT NULL,
    author_initials TEXT,
    body TEXT NOT NULL,
    reply_count INT DEFAULT 0,
    posted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS calendar_events (
    id SERIAL PRIMARY KEY,
    course_id INT REFERENCES courses(id),
    title TEXT NOT NULL,
    event_date DATE NOT NULL,
    event_type TEXT DEFAULT 'deadline',
    color TEXT DEFAULT '#c8102e'
);

INSERT INTO students (name, email, student_id, program, semester)
VALUES ('Sumedh Joshi', 'sumedh@learnspace.ca', 'STU-2024-001', 'Cloud & AI Engineering', 2)
ON CONFLICT DO NOTHING;

INSERT INTO courses (code, name, instructor, schedule, color, progress) VALUES
('AIML-2210', 'Machine Learning & AI Fundamentals', 'Dr. Patel', 'Mon/Wed', '#c8102e', 72),
('CLOD-3100', 'Cloud Infrastructure & DevOps', 'Prof. Singh', 'Tue/Thu', '#1d6fa5', 60),
('PROJ-1050', 'Project Management Essentials', 'Ms. Chen', 'Wednesday', '#16a34a', 85),
('DATA-4020', 'Data Engineering & Pipelines', 'Dr. Nguyen', 'Friday', '#7c3aed', 45)
ON CONFLICT DO NOTHING;

INSERT INTO assignments (course_id, title, due_date, points, status, score) VALUES
(1, 'Lab Report 3 — Neural Networks', '2026-05-22', 50, 'due', NULL),
(2, 'Cloud Deployment Lab', '2026-05-24', 40, 'pending', NULL),
(3, 'Project Case Study', '2026-05-26', 60, 'pending', NULL),
(4, 'Data Pipeline Design', '2026-05-18', 45, 'submitted', NULL),
(2, 'AWS IAM Policy Lab', '2026-05-15', 30, 'graded', 92),
(1, 'ML Model Evaluation', '2026-05-10', 50, 'graded', 88),
(3, 'Agile Sprint Retro', '2026-05-08', 20, 'graded', 20)
ON CONFLICT DO NOTHING;

INSERT INTO grades (student_id, course_id, percentage, letter_grade) VALUES
(1, 1, 88.0, 'A'),
(1, 2, 91.0, 'A+'),
(1, 3, 82.0, 'B+'),
(1, 4, 92.0, 'A+')
ON CONFLICT DO NOTHING;

INSERT INTO quizzes (course_id, title, scheduled_date, duration_mins, total_questions, total_points, status) VALUES
(1, 'AIML-2210 Midterm Quiz', '2026-05-25', 45, 30, 100, 'upcoming'),
(2, 'CLOD-3100 AWS Concepts Quiz', '2026-05-28', 30, 20, 50, 'upcoming'),
(4, 'DATA-4020 Pipelines Quiz 1', '2026-05-14', 30, 25, 50, 'graded'),
(3, 'PROJ-1050 Agile Quiz', '2026-05-10', 20, 20, 20, 'graded')
ON CONFLICT DO NOTHING;

INSERT INTO announcements (course_id, title, body, audience, posted_at) VALUES
(NULL, 'Final exam schedule now published', 'The final examination timetable for Semester 2 has been posted. Please check your individual course pages for room assignments.', 'all', '2026-05-21 10:00:00+00'),
(NULL, 'Extended library hours during exam period', 'The Learning Resource Centre will be open until midnight, Sunday through Thursday, from May 23 to June 6.', 'all', '2026-05-20 09:00:00+00'),
(1, 'Classroom change — Monday May 25', 'AIML-2210 lecture on Monday is relocated to Room 2A-14 due to scheduled maintenance.', 'AIML-2210', '2026-05-18 14:00:00+00'),
(2, 'Guest lecture — AWS Solutions Architect', 'We will have a guest speaker from AWS Canada joining us on May 29.', 'CLOD-3100', '2026-05-15 11:00:00+00')
ON CONFLICT DO NOTHING;

INSERT INTO discussions (course_id, author_name, author_initials, body, reply_count, posted_at) VALUES
(1, 'Sarah P.', 'SP', 'Has anyone figured out the RAG pipeline architecture for the final project? Confused about chunking strategy vs embedding model tradeoffs.', 4, NOW() - INTERVAL '2 hours'),
(2, 'Mike K.', 'MK', 'For CLOD-3100 Lab 4 — do we use Terraform or CloudFormation? Prof. Singh was not clear in the slides.', 7, NOW() - INTERVAL '5 hours'),
(1, 'Riya G.', 'RG', 'Study group for the AIML midterm this Sunday at 2pm in the library, Room LIB-220. Let me know if you are in!', 12, NOW() - INTERVAL '1 day'),
(1, 'TA — Dr. Patel', 'TA', 'Reminder: Office hours this week are moved to Thursday 3-5pm. Assignment 3 questions welcome.', 2, NOW() - INTERVAL '2 days')
ON CONFLICT DO NOTHING;

INSERT INTO calendar_events (course_id, title, event_date, event_type, color) VALUES
(1, 'Lab Report 3 due', '2026-05-22', 'deadline', '#c8102e'),
(2, 'Cloud Deployment Lab due', '2026-05-24', 'deadline', '#1d6fa5'),
(1, 'AIML Midterm Quiz', '2026-05-25', 'quiz', '#c8102e'),
(3, 'Project Case Study due', '2026-05-26', 'deadline', '#16a34a'),
(2, 'AWS Concepts Quiz', '2026-05-28', 'quiz', '#1d6fa5'),
(2, 'AWS Guest Lecture', '2026-05-29', 'event', '#1d6fa5')
ON CONFLICT DO NOTHING;
