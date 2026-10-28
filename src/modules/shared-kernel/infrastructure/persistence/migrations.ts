// Schema source of truth: hand-reviewed SQL, applied in order, tracked by PRAGMA user_version.
// Entities map onto these tables. Append only. Never edit a shipped migration; add a new one.
const TS = "(strftime('%Y-%m-%dT%H:%M:%fZ','now'))"

/** `rebuildsTables` migrations run with foreign keys off (SQLite's table-rebuild procedure) and are FK-checked before commit. */
export type Migration = { sql: string; rebuildsTables?: boolean }

const V1 = `
CREATE TABLE projects (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 120),
  description TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '#086d73',
  created_at TEXT NOT NULL DEFAULT ${TS}
);

CREATE TABLE tasks (
  id INTEGER PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 300),
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('backlog','todo','doing','review','done')),
  priority TEXT NOT NULL CHECK (priority IN ('low','medium','high')),
  due_date TEXT,
  labels TEXT NOT NULL DEFAULT '[]',
  position REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT
);
CREATE INDEX tasks_project ON tasks(project_id, status, position);

CREATE TABLE subtasks (
  id INTEGER PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 300),
  done INTEGER NOT NULL DEFAULT 0,
  position REAL NOT NULL DEFAULT 0
);
CREATE INDEX subtasks_task ON subtasks(task_id, position);

CREATE TABLE task_activity (
  id INTEGER PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  detail TEXT,
  created_at TEXT NOT NULL DEFAULT ${TS}
);
CREATE INDEX task_activity_task ON task_activity(task_id, id);
`

// Linear-style identifiers (KEY-12), urgent/none priorities, and comments.
const V2 = `
ALTER TABLE projects ADD COLUMN key TEXT NOT NULL DEFAULT '';
UPDATE projects SET key = 'P' || id;
UPDATE projects SET color = '#5e6ad2' WHERE color NOT IN ('#5e6ad2','#26b5ce','#4cb782','#f2c94c','#f2994a','#eb5757','#bb87fc','#95a2b3');
CREATE UNIQUE INDEX projects_key ON projects(key);

CREATE TABLE tasks_v2 (
  id INTEGER PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 300),
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('backlog','todo','doing','review','done')),
  priority TEXT NOT NULL CHECK (priority IN ('none','low','medium','high','urgent')),
  due_date TEXT,
  labels TEXT NOT NULL DEFAULT '[]',
  position REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT,
  UNIQUE (project_id, number)
);
INSERT INTO tasks_v2
  SELECT t.id, t.project_id, (SELECT COUNT(*) FROM tasks o WHERE o.project_id = t.project_id AND o.id <= t.id),
         t.title, t.description, t.status, t.priority, t.due_date, t.labels, t.position, t.created_at, t.updated_at, t.completed_at
  FROM tasks t;
DROP TABLE tasks;
ALTER TABLE tasks_v2 RENAME TO tasks;
CREATE INDEX tasks_project ON tasks(project_id, status, position);

CREATE TABLE task_comments (
  id INTEGER PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 20000),
  created_at TEXT NOT NULL DEFAULT ${TS},
  updated_at TEXT NOT NULL DEFAULT ${TS}
);
CREATE INDEX task_comments_task ON task_comments(task_id, id);
`

export const MIGRATIONS: readonly Migration[] = [{ sql: V1 }, { sql: V2, rebuildsTables: true }]
