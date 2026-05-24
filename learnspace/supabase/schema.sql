create table courses (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  instructor text,
  schedule text,
  color text,
  progress int default 0
);

create table assignments (
  id uuid primary key default gen_random_uuid(),
  student_id text default 'default',
  name text not null,
  course text not null,
  due_date date,
  status text default 'pending',
  points int,
  score int,
  created_at timestamptz default now()
);

create table grades (
  id uuid primary key default gen_random_uuid(),
  student_id text default 'default',
  course text not null,
  name text,
  percentage int,
  letter text,
  credits int default 3
);

create table quizzes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  course text not null,
  date date,
  duration_min int,
  questions int,
  points int,
  status text default 'upcoming',
  score int
);

create table announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  date date default current_date,
  course text
);
