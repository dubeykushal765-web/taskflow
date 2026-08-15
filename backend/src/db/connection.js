import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../taskflow.db');
const db = new DatabaseSync(dbPath);
db.exec('PRAGMA foreign_keys = ON');

export default db;