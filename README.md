# TaskFlow

A small Trello-like task board built with React, Express, and SQLite.
## Live demo

- Frontend: https://taskflow-two-lovat.vercel.app
- Backend API: https://taskflow-d11x.onrender.com/api/board

## Tech stack

- **Frontend:** React + Vite (JavaScript)
- **Backend:** Node.js + Express
- **Database:** SQLite (via Node's built-in `node:sqlite` module — no external DB dependency)
- **Testing:** Vitest + Supertest

## Features

- View a board with To Do / In Progress / Done columns
- Create, edit, and delete tasks
- Move tasks between columns via a dropdown
- Filter tasks by priority (Low / Medium / High)
- Backend validation (rejects empty titles even if the frontend is bypassed)
- Friendly error messages on failed requests (no blank screens or raw errors)
- Data persists in a real SQLite database — refreshing the page keeps your changes

## Database schema

See [`backend/schema.sql`](./backend/schema.sql). Summary:

- `boards` — id, name
- `columns` — id, board_id (FK → boards), name, position
- `tasks` — id, column_id (FK → columns), title (NOT NULL), description, priority (CHECK constraint: Low/Medium/High), created_at

Foreign keys are enforced via `PRAGMA foreign_keys = ON` in the DB connection.

## Required queries

Both live in `backend/src/app.js`:

1. **Task count per column** — `GET /api/stats/columns`, uses `COUNT()` + `GROUP BY` at the database level.
2. **Tasks by priority, newest first** — `GET /api/tasks/priority/:level`, filters and sorts in SQL, not in JavaScript.

## Setup instructions (from a fresh clone)

### Backend
```bash
cd backend
npm install
npm run db:init    # creates and seeds the SQLite database
npm run dev         # starts the API on http://localhost:3001
```

### Frontend
In a separate terminal:
```bash
cd frontend
npm install
npm run dev          # starts React on http://localhost:5173
```

Open `http://localhost:5173` in your browser.

**Note:** this project uses Node's built-in `node:sqlite` module, which requires **Node.js 22.5+** and is passed via the `--experimental-sqlite` flag (already included in the npm scripts).

## Running tests

```bash
cd backend
npm test
```

Covers:
1. Creating a task with no title is rejected (400)
2. Moving a task correctly updates its column
3. The priority query returns correct results against known seed data

## API overview

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/board` | Board with nested columns/tasks; optional `?priority=` filter |
| POST | `/api/tasks` | Create a task |
| PUT | `/api/tasks/:id` | Edit a task |
| PATCH | `/api/tasks/:id/move` | Move a task to a different column |
| DELETE | `/api/tasks/:id` | Delete a task |
| GET | `/api/stats/columns` | Task count per column |
| GET | `/api/tasks/priority/:level` | Tasks filtered by priority, newest first |

## Assumptions & decisions

- Used Node's built-in `node:sqlite` instead of `better-sqlite3`, after hitting native-module build issues on Windows — this avoids any compiled dependencies entirely.
- Move is implemented via a dropdown rather than drag-and-drop, per the assignment's guidance to prioritize a working core over a nicer-but-riskier interaction.
- Single hardcoded board (no multi-board support) since the assignment scope is one team's board.
- [FILL IN: any other assumption you made, e.g. default priority when none is given, column ordering, etc.]

## What I'd improve with more time

- Add drag-and-drop as the stretch goal, now that the dropdown-based core is solid.
- Add a text search box for filtering by title.
- Add more edge-case tests (e.g. moving a task to a non-existent column, deleting a task that doesn't exist).
- Move `node:sqlite` to a more established database driver once it's out of Node's experimental stage.

## Time spent

Approximately 16 hours  over three days  days.

## Something I learned

I learned that Node.js now ships an experimental built-in SQLite module (`node:sqlite`), which let me avoid native-module build headaches I ran into with `better-sqlite3` on Windows. I also got a clearer picture of the difference between CommonJS (`require`) and ES modules (`import`) in Node, after Vitest required switching the whole backend over to ES modules to work correctly.

- If no priority is specified when creating a task, it defaults to "Medium".
- Columns are ordered using a `position` field rather than relying on database insertion order, so column order stays stable regardless of how rows were inserted.