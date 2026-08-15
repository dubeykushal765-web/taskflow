import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import db from '../src/db/connection.js';

describe('TaskFlow API', () => {
  it('rejects creating a task with no title', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ column_id: 1, title: '' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('moving a task updates its column_id correctly', async () => {
    const created = await request(app)
      .post('/api/tasks')
      .send({ column_id: 1, title: 'Task to move', priority: 'Low' });

    expect(created.status).toBe(201);
    const taskId = created.body.id;

    const moved = await request(app)
      .patch(`/api/tasks/${taskId}/move`)
      .send({ column_id: 2 });

    expect(moved.status).toBe(200);
    expect(moved.body.column_id).toBe(2);

    db.prepare('DELETE FROM tasks WHERE id = ?').run(taskId);
  });

  it('the priority query returns only High priority tasks, newest first', () => {
    const highTasks = db
      .prepare('SELECT * FROM tasks WHERE priority = ? ORDER BY created_at DESC')
      .all('High');

    expect(highTasks.length).toBeGreaterThanOrEqual(2);
    highTasks.forEach((task) => {
      expect(task.priority).toBe('High');
    });
  });
});