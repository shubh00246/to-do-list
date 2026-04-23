# Dynamic To-Do List — DBMS Lab Assignment

## Folder Structure
```
dynamic_todo_list/
  frontend/
    index.html      ← UI layout
    style.css       ← Styling
    script.js       ← Frontend JS with API calls + localStorage fallback
  backend/
    server.js       ← Express REST API
    package.json    ← Node dependencies
    db.sqlite       ← Auto-created on first run
  README.md
```

---

## Setup & Run

### Step 1 — Install backend dependencies
```bash
cd backend
npm install
```

### Step 2 — Start the server
```bash
node server.js
# or for auto-reload during development:
npx nodemon server.js
```

### Step 3 — Open the app
Visit: **http://localhost:3000/index.html**

The frontend is served statically by Express, so no separate server needed.

---

## REST API Reference

| Method | Endpoint              | Description               |
|--------|-----------------------|---------------------------|
| GET    | `/tasks`              | Get all tasks             |
| POST   | `/tasks`              | Create a new task         |
| PUT    | `/tasks/:id`          | Update title/priority/etc |
| PATCH  | `/tasks/:id/status`   | Toggle completed status   |
| DELETE | `/tasks/:id`          | Delete a task             |

### Request body for POST/PUT
```json
{
  "title":       "Buy groceries",
  "priority":    "High",
  "description": "From the market",
  "dueDate":     "2025-12-31"
}
```

---

## Database Schema (SQLite)

```sql
CREATE TABLE tasks (
  id          INTEGER  PRIMARY KEY AUTOINCREMENT,
  title       TEXT     NOT NULL,
  priority    TEXT     DEFAULT 'Medium',
  description TEXT     DEFAULT '',
  dueDate     TEXT     DEFAULT '',
  isDone      INTEGER  DEFAULT 0,
  createdAt   DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## Features Implemented

### Core (Mandatory)
- ✅ Add task (title + priority + optional description)
- ✅ Edit task (title, priority, description, due date)
- ✅ Delete task (with fade-out animation)
- ✅ Mark task complete / incomplete (checkbox)
- ✅ Filter tasks: All / Active / Completed
- ✅ Task counter: Total / Done / Active
- ✅ Input validation (empty check, max 50 chars)
- ✅ Persistent storage via SQLite + REST API
- ✅ Responsive / mobile-friendly layout

### Bonus Features
- ✅ **Search** tasks by keyword (title or description)
- ✅ **Sort** by Newest, Oldest, or Priority
- ✅ **Due date** field with **overdue highlight**
- ✅ **localStorage fallback** (works offline if server is down)
- ✅ **Export to JSON** button

---

## Notes
- If the backend server is not running, the app automatically falls back to `localStorage` so tasks are still saved locally.
- The `db.sqlite` file is auto-created in the `backend/` folder on first run.
