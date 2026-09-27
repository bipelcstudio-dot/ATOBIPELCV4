-- Additive schema for meeting scheduling.
CREATE TABLE IF NOT EXISTS meetings (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  meeting_date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT,
  timezone TEXT DEFAULT 'Asia/Baku',
  location TEXT,
  meeting_link TEXT,
  agenda TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'Scheduled' CHECK(status IN ('Scheduled','In Progress','Completed','Cancelled')),
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  organizer_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  attendees TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_meetings_date_time ON meetings(meeting_date,start_time);
