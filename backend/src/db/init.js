import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schema = fs.readFileSync(path.join(__dirname, '../../schema.sql'), 'utf8');
db.exec(schema);

const insertBoard = db.prepare('INSERT INTO boards (name) VALUES (?)');
const insertColumn = db.prepare('INSERT INTO columns (board_id, name, position) VALUES (?, ?, ?)');
const insertTask = db.prepare(
  'INSERT INTO tasks (column_id, title, description, priority) VALUES (?, ?, ?, ?)'
);

const boardId = insertBoard.run('TaskFlow Board').lastInsertRowid;

const todoId = insertColumn.run(boardId, 'To Do', 0).lastInsertRowid;
const inProgressId = insertColumn.run(boardId, 'In Progress', 1).lastInsertRowid;
const doneId = insertColumn.run(boardId, 'Done', 2).lastInsertRowid;

insertTask.run(todoId, 'Set up project repo', 'Init frontend and backend folders', 'Medium');
insertTask.run(todoId, 'Design database schema', null, 'High');
insertTask.run(inProgressId, 'Build task board UI', 'Columns + cards', 'Medium');
insertTask.run(inProgressId, 'Write API routes', null, 'High');
insertTask.run(doneId, 'Read assignment doc', null, 'Low');
insertTask.run(doneId, 'Pick tech stack', 'React + Express + SQLite', 'Low');

console.log('Database initialized and seeded ✅');