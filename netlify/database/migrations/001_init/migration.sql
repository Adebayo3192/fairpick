-- FairPick database schema

CREATE TABLE IF NOT EXISTS students (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL DEFAULT '',
  type        TEXT NOT NULL DEFAULT 'boy' CHECK (type IN ('boy','girl','kid')),
  draw_num    INTEGER,
  archived    BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS malams (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  role        TEXT DEFAULT '',
  days        INTEGER[] NOT NULL DEFAULT '{6,0,1,2,3}',
  sessions    TEXT[] NOT NULL DEFAULT '{"morning","evening"}',
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance (
  id          SERIAL PRIMARY KEY,
  date        TEXT NOT NULL,
  session     TEXT NOT NULL CHECK (session IN ('morning','evening')),
  present_ids TEXT[] NOT NULL DEFAULT '{}',
  note        TEXT DEFAULT '',
  saved_at    TIMESTAMP DEFAULT NOW(),
  UNIQUE(date, session)
);

CREATE TABLE IF NOT EXISTS malam_attendance (
  id          SERIAL PRIMARY KEY,
  date        TEXT NOT NULL,
  session     TEXT NOT NULL CHECK (session IN ('morning','evening')),
  present_ids TEXT[] NOT NULL DEFAULT '{}',
  note        TEXT DEFAULT '',
  saved_at    TIMESTAMP DEFAULT NOW(),
  UNIQUE(date, session)
);

CREATE TABLE IF NOT EXISTS draw_history (
  id          SERIAL PRIMARY KEY,
  num         INTEGER NOT NULL,
  student_id  TEXT,
  student_name TEXT,
  task        TEXT DEFAULT '',
  round       INTEGER NOT NULL DEFAULT 1,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clean_history (
  id          SERIAL PRIMARY KEY,
  student_id  TEXT NOT NULL,
  student_name TEXT,
  round       INTEGER NOT NULL DEFAULT 1,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_state (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL
);

-- Default state values
INSERT INTO app_state (key, value) VALUES
  ('draw_pool', '[]'),
  ('draw_round', '1'),
  ('draw_from', '1'),
  ('draw_to', '20'),
  ('clean_pool', '[]'),
  ('clean_round', '1'),
  ('present', '[]')
ON CONFLICT (key) DO NOTHING;
