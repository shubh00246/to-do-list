// ─────────────────────────────────────────
//  Config — change BASE_URL to your backend
// ─────────────────────────────────────────
const BASE_URL = 'http://localhost:3000';

// ─────────────────────────────────────────
//  State
// ─────────────────────────────────────────
let tasks = [];           // local cache
let currentFilter = 'all';
let editingId = null;

// ─────────────────────────────────────────
//  Startup
// ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadTasks();
});

// ─────────────────────────────────────────
//  API helpers
// ─────────────────────────────────────────
async function apiFetch(path, options = {}) {
  try {
    const res = await fetch(BASE_URL + path, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('API error, using localStorage fallback:', err.message);
    return null;   // triggers localStorage fallback
  }
}

// ─────────────────────────────────────────
//  LocalStorage fallback helpers
// ─────────────────────────────────────────
function lsLoad() {
  return JSON.parse(localStorage.getItem('todo_tasks') || '[]');
}
function lsSave(arr) {
  localStorage.setItem('todo_tasks', JSON.stringify(arr));
}
function lsNextId() {
  const all = lsLoad();
  return all.length ? Math.max(...all.map(t => t.id)) + 1 : 1;
}

// ─────────────────────────────────────────
//  CRUD — Load all
// ─────────────────────────────────────────
async function loadTasks() {
  const data = await apiFetch('/tasks');
  if (data) {
    tasks = data;
  } else {
    tasks = lsLoad();
  }
  renderTasks();
}

// ─────────────────────────────────────────
//  CRUD — Add
// ─────────────────────────────────────────
async function addTask() {
  const titleEl    = document.getElementById('taskTitle');
  const priorityEl = document.getElementById('taskPriority');
  const descEl     = document.getElementById('taskDesc');
  const dueEl      = document.getElementById('taskDue');
  const errorEl    = document.getElementById('errorMsg');

  const title    = titleEl.value.trim();
  const priority = priorityEl.value;
  const description = descEl.value.trim();
  const dueDate  = dueEl.value;

  // Validation
  if (!title) { showError(errorEl, 'Task title cannot be empty.'); return; }
  if (title.length > 50) { showError(errorEl, 'Title must be 50 characters or less.'); return; }
  errorEl.textContent = '';

  const payload = { title, priority, description, dueDate };

  const data = await apiFetch('/tasks', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (data) {
    tasks.push(data);
  } else {
    // LocalStorage fallback
    const newTask = {
      id: lsNextId(),
      title,
      priority,
      description,
      dueDate,
      isDone: 0,
      createdAt: new Date().toISOString(),
    };
    tasks.push(newTask);
    lsSave(tasks);
  }

  titleEl.value = '';
  descEl.value  = '';
  dueEl.value   = '';
  renderTasks();
  animateCounter();
}

// ─────────────────────────────────────────
//  CRUD — Toggle done
// ─────────────────────────────────────────
async function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  const data = await apiFetch(`/tasks/${id}/status`, { method: 'PATCH' });

  if (data) {
    task.isDone = data.isDone;
  } else {
    task.isDone = task.isDone ? 0 : 1;
    lsSave(tasks);
  }
  renderTasks();
}

// ─────────────────────────────────────────
//  CRUD — Delete
// ─────────────────────────────────────────
async function deleteTask(id) {
  const card = document.querySelector(`[data-id="${id}"]`);
  if (card) { card.style.opacity = '0'; card.style.transform = 'translateX(20px)'; }

  await new Promise(r => setTimeout(r, 180));

  const data = await apiFetch(`/tasks/${id}`, { method: 'DELETE' });

  if (data !== null) {
    tasks = tasks.filter(t => t.id !== id);
  } else {
    tasks = tasks.filter(t => t.id !== id);
    lsSave(tasks);
  }
  renderTasks();
}

// ─────────────────────────────────────────
//  CRUD — Edit (open modal)
// ─────────────────────────────────────────
function openEdit(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  editingId = id;

  document.getElementById('editTitle').value    = task.title;
  document.getElementById('editDesc').value     = task.description || '';
  document.getElementById('editPriority').value = task.priority;
  document.getElementById('editDue').value      = task.dueDate || '';
  document.getElementById('editErrorMsg').textContent = '';

  document.getElementById('modalOverlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  editingId = null;
}

async function saveEdit() {
  const title    = document.getElementById('editTitle').value.trim();
  const priority = document.getElementById('editPriority').value;
  const description = document.getElementById('editDesc').value.trim();
  const dueDate  = document.getElementById('editDue').value;
  const errorEl  = document.getElementById('editErrorMsg');

  if (!title) { showError(errorEl, 'Title cannot be empty.'); return; }
  if (title.length > 50) { showError(errorEl, 'Max 50 characters.'); return; }

  const payload = { title, priority, description, dueDate };

  const data = await apiFetch(`/tasks/${editingId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  const task = tasks.find(t => t.id === editingId);
  if (task) {
    task.title       = title;
    task.priority    = priority;
    task.description = description;
    task.dueDate     = dueDate;
    if (!data) lsSave(tasks);
  }

  closeModal();
  renderTasks();
}

// ─────────────────────────────────────────
//  Filter
// ─────────────────────────────────────────
function setFilter(filter, btn) {
  currentFilter = filter;
  document.querySelectorAll('.filter-btn[data-filter]').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderTasks();
}

// ─────────────────────────────────────────
//  Render
// ─────────────────────────────────────────
function renderTasks() {
  const list    = document.getElementById('taskList');
  const empty   = document.getElementById('emptyState');
  const search  = document.getElementById('searchInput').value.toLowerCase();
  const sort    = document.getElementById('sortSelect').value;

  // Filter
  let filtered = tasks.filter(t => {
    if (currentFilter === 'active'    && t.isDone)  return false;
    if (currentFilter === 'completed' && !t.isDone) return false;
    if (search && !t.title.toLowerCase().includes(search) &&
        !(t.description || '').toLowerCase().includes(search)) return false;
    return true;
  });

  // Sort
  const priorityOrder = { High: 0, Medium: 1, Low: 2 };
  if (sort === 'newest')   filtered.sort((a,b) => b.id - a.id);
  if (sort === 'oldest')   filtered.sort((a,b) => a.id - b.id);
  if (sort === 'priority') filtered.sort((a,b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // Clear existing cards
  list.querySelectorAll('.task-card').forEach(c => c.remove());

  if (filtered.length === 0) {
    empty.style.display = 'flex';
  } else {
    empty.style.display = 'none';
    filtered.forEach(task => list.appendChild(createCard(task)));
  }

  updateCounters();
}

// ─────────────────────────────────────────
//  Create card DOM element
// ─────────────────────────────────────────
function createCard(task) {
  const card = document.createElement('div');
  card.className = `task-card priority-${task.priority}${task.isDone ? ' done' : ''}`;
  card.dataset.id = task.id;

  // Due date display
  let dueHtml = '';
  if (task.dueDate) {
    const today    = new Date(); today.setHours(0,0,0,0);
    const due      = new Date(task.dueDate);
    const overdue  = !task.isDone && due < today;
    dueHtml = `<div class="task-due${overdue ? ' overdue' : ''}">
      ${overdue ? '⚠ Overdue · ' : '📅 Due '}${formatDate(task.dueDate)}
    </div>`;
  }

  card.innerHTML = `
    <input type="checkbox" class="task-check" ${task.isDone ? 'checked' : ''}
           onchange="toggleTask(${task.id})" title="Mark complete"/>
    <div class="task-body">
      <div class="task-meta">
        <span class="task-title">${escapeHtml(task.title)}</span>
        <span class="badge badge-${task.priority}">${task.priority}</span>
      </div>
      ${task.description ? `<div class="task-desc">${escapeHtml(task.description)}</div>` : ''}
      ${dueHtml}
    </div>
    <div class="task-actions">
      <button class="icon-btn" onclick="openEdit(${task.id})" title="Edit">✎</button>
      <button class="icon-btn delete" onclick="deleteTask(${task.id})" title="Delete">✕</button>
    </div>`;

  return card;
}

// ─────────────────────────────────────────
//  Counters
// ─────────────────────────────────────────
function updateCounters() {
  const total  = tasks.length;
  const done   = tasks.filter(t => t.isDone).length;
  const active = total - done;
  document.getElementById('totalCount').textContent  = total;
  document.getElementById('doneCount').textContent   = done;
  document.getElementById('activeCount').textContent = active;
}

function animateCounter() {
  document.querySelectorAll('.counter-num').forEach(el => {
    el.style.transform = 'scale(1.3)';
    setTimeout(() => el.style.transform = 'scale(1)', 200);
  });
}

// ─────────────────────────────────────────
//  Bonus: Export to JSON
// ─────────────────────────────────────────
function exportJSON() {
  const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'tasks.json';
  a.click();
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────
function showError(el, msg) {
  el.textContent = msg;
  el.style.animation = 'none';
  requestAnimationFrame(() => { el.style.animation = ''; });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
}

// Enter key triggers add
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && document.activeElement.id === 'taskTitle') addTask();
  if (e.key === 'Escape') closeModal();
});
