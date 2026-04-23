const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');

const app     = express();
const PORT    = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'db.json');

app.use(cors());
app.use(express.json());

// Serve frontend from same folder (all files are in To-do-list root)
app.use(express.static(path.join(__dirname)));

// ── JSON file as database ──
function loadDB() {
  if (fs.existsSync(DB_PATH)) {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  }
  return { tasks: [], nextId: 1 };
}
function saveDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

// GET /tasks
app.get('/tasks', (req, res) => {
  const db = loadDB();
  res.json(db.tasks.slice().reverse());
});

// POST /tasks
app.post('/tasks', (req, res) => {
  const { title, priority = 'Medium', description = '', dueDate = '' } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: 'Title required.' });
  if (title.length > 50)       return res.status(400).json({ error: 'Max 50 chars.' });

  const db   = loadDB();
  const task = {
    id: db.nextId++,
    title: title.trim(),
    priority,
    description,
    dueDate,
    isDone: 0,
    createdAt: new Date().toISOString()
  };
  db.tasks.push(task);
  saveDB(db);
  res.status(201).json(task);
});

// PUT /tasks/:id
app.put('/tasks/:id', (req, res) => {
  const id = Number(req.params.id);
  const { title, priority = 'Medium', description = '', dueDate = '' } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: 'Title required.' });

  const db   = loadDB();
  const task = db.tasks.find(t => t.id === id);
  if (!task) return res.status(404).json({ error: 'Not found.' });

  task.title       = title.trim();
  task.priority    = priority;
  task.description = description;
  task.dueDate     = dueDate;
  saveDB(db);
  res.json(task);
});

// PATCH /tasks/:id/status
app.patch('/tasks/:id/status', (req, res) => {
  const id   = Number(req.params.id);
  const db   = loadDB();
  const task = db.tasks.find(t => t.id === id);
  if (!task) return res.status(404).json({ error: 'Not found.' });

  task.isDone = task.isDone ? 0 : 1;
  saveDB(db);
  res.json(task);
});

// DELETE /tasks/:id
app.delete('/tasks/:id', (req, res) => {
  const id    = Number(req.params.id);
  const db    = loadDB();
  const index = db.tasks.findIndex(t => t.id === id);
  if (index === -1) return res.status(404).json({ error: 'Not found.' });

  db.tasks.splice(index, 1);
  saveDB(db);
  res.json({ success: true, id });
});

app.listen(PORT, () => {
  console.log(`\n✅  Server running at http://localhost:${PORT}`);
  console.log(`📋  Open: http://localhost:${PORT}/index.html\n`);
});
