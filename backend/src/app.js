import express from 'express';
import cors from 'cors';
import db from './db/connection.js';

const app = express();
app.use(cors());
app.use(express.json());

// GET /api/board — board with columns and tasks nested, optional priority filter
app.get('/api/board', (req, res) => {
  const { priority } = req.query;
  const board = db.prepare('SELECT * FROM boards LIMIT 1').get();
  const columns = db.prepare('SELECT * FROM columns WHERE board_id = ? ORDER BY position').all(board.id);

  const columnsWithTasks = columns.map((col) => {
    const tasks = priority
      ? db.prepare('SELECT * FROM tasks WHERE column_id = ? AND priority = ? ORDER BY created_at DESC').all(col.id, priority)
      : db.prepare('SELECT * FROM tasks WHERE column_id = ? ORDER BY created_at DESC').all(col.id);
    return { ...col, tasks };
  });

  res.json({ ...board, columns: columnsWithTasks });
});

// POST /api/tasks — create a task (title required)
app.post('/api/tasks', (req, res) => {
  const { column_id, title, description, priority } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }
  if (!column_id) {
    return res.status(400).json({ error: 'column_id is required' });
  }

  const validPriorities = ['Low', 'Medium', 'High'];
  const finalPriority = priority && validPriorities.includes(priority) ? priority : 'Medium';

  const result = db
    .prepare('INSERT INTO tasks (column_id, title, description, priority) VALUES (?, ?, ?, ?)')
    .run(column_id, title.trim(), description || null, finalPriority);

  const newTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(newTask);
});

// PUT /api/tasks/:id — edit title/description/priority
app.put('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, priority } = req.body;

  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Task not found' });
  }
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const validPriorities = ['Low', 'Medium', 'High'];
  const finalPriority = priority && validPriorities.includes(priority) ? priority : existing.priority;

  db.prepare('UPDATE tasks SET title = ?, description = ?, priority = ? WHERE id = ?')
    .run(title.trim(), description ?? null, finalPriority, id);

  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  res.json(updated);
});

// PATCH /api/tasks/:id/move — move task to a new column
app.patch('/api/tasks/:id/move', (req, res) => {
  const { id } = req.params;
  const { column_id } = req.body;

  const existingTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (!existingTask) {
    return res.status(404).json({ error: 'Task not found' });
  }
  const existingColumn = db.prepare('SELECT * FROM columns WHERE id = ?').get(column_id);
  if (!existingColumn) {
    return res.status(400).json({ error: 'Invalid column_id' });
  }

  db.prepare('UPDATE tasks SET column_id = ? WHERE id = ?').run(column_id, id);
  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  res.json(updated);
});

// DELETE /api/tasks/:id
app.delete('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Task not found' });
  }
  db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  res.status(204).send();
});

// GET /api/stats/columns — Query 1: task count per column (calculated by the DB, not JS)
app.get('/api/stats/columns', (req, res) => {
  const counts = db
    .prepare(`
      SELECT columns.id AS column_id, columns.name AS column_name, COUNT(tasks.id) AS task_count
      FROM columns
      LEFT JOIN tasks ON tasks.column_id = columns.id
      GROUP BY columns.id
      ORDER BY columns.position
    `)
    .all();
  res.json(counts);
});

// GET /api/tasks/priority/:level — Query 2: tasks by priority, newest first
app.get('/api/tasks/priority/:level', (req, res) => {
  const { level } = req.params;
  const validPriorities = ['Low', 'Medium', 'High'];
  if (!validPriorities.includes(level)) {
    return res.status(400).json({ error: 'Invalid priority level' });
  }

  const tasks = db
    .prepare('SELECT * FROM tasks WHERE priority = ? ORDER BY created_at DESC')
    .all(level);
  res.json(tasks);
});

// Catch-all error handler — keeps the API from crashing with a raw stack trace
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server' });
});

export default app;

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`TaskFlow backend running on http://localhost:${PORT}`);
});