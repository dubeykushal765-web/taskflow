import { useEffect, useState } from 'react';
import { getBoard, createTask, updateTask, moveTask, deleteTask } from './services/api';
import './App.css';

const PRIORITIES = ['Low', 'Medium', 'High'];

function App() {
  const [board, setBoard] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState('Medium');
  const [newColumnId, setNewColumnId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState('Medium');

  async function loadBoard(priority) {
    try {
      setError('');
      const data = await getBoard(priority === 'All' ? undefined : priority);
      setBoard(data);
      if (data.columns.length > 0 && newColumnId === null) {
        setNewColumnId(data.columns[0].id);
      }
    } catch (err) {
      setError('Unable to load the board. Please refresh the page.');
    }
  }

  useEffect(() => {
    loadBoard(filter);
  }, [filter]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!newTitle.trim()) {
      setError('Title is required.');
      return;
    }
    try {
      setError('');
      await createTask({
        column_id: newColumnId,
        title: newTitle,
        description: newDescription,
        priority: newPriority,
      });
      setNewTitle('');
      setNewDescription('');
      setNewPriority('Medium');
      loadBoard(filter);
    } catch (err) {
      setError('Unable to create task. Please try again.');
    }
  }

  async function handleDelete(id) {
    try {
      setError('');
      await deleteTask(id);
      loadBoard(filter);
    } catch (err) {
      setError('Unable to delete task. Please try again.');
    }
  }

  async function handleMove(id, column_id) {
    try {
      setError('');
      await moveTask(id, column_id);
      loadBoard(filter);
    } catch (err) {
      setError('Unable to move task. Please try again.');
    }
  }
  function startEdit(task) {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setEditPriority(task.priority);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function handleUpdate(id) {
    if (!editTitle.trim()) {
      setError('Title is required.');
      return;
    }
    try {
      setError('');
      await updateTask(id, {
        title: editTitle,
        description: editDescription,
        priority: editPriority,
      });
      setEditingId(null);
      loadBoard(filter);
    } catch (err) {
      setError('Unable to update task. Please try again.');
    }
  }

  if (!board) {
    return <div className="loading">{error || 'Loading board...'}</div>;
  }

  return (
    <div className="app">
      <header className="header">
        <h1>TaskFlow</h1>
        <div className="controls">
          <label>
            Filter:
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="All">All</option>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </label>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <form className="new-task-form" onSubmit={handleCreate}>
        <input
          type="text"
          placeholder="Task title"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <input
          type="text"
          placeholder="Description (optional)"
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
        />
        <select value={newPriority} onChange={(e) => setNewPriority(e.target.value)}>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select value={newColumnId || ''} onChange={(e) => setNewColumnId(Number(e.target.value))}>
          {board.columns.map((col) => (
            <option key={col.id} value={col.id}>{col.name}</option>
          ))}
        </select>
        <button type="submit">+ New Task</button>
      </form>

      <div className="board">
        {board.columns.map((col) => (
          <div className="column" key={col.id}>
            <h2>{col.name} <span className="count">({col.tasks.length})</span></h2>
           {col.tasks.map((task) =>
              editingId === task.id ? (
                <div className="task-card editing" key={task.id}>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Title"
                  />
                  <input
                    type="text"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Description (optional)"
                  />
                  <select value={editPriority} onChange={(e) => setEditPriority(e.target.value)}>
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <div className="card-actions">
                    <button className="save-btn" onClick={() => handleUpdate(task.id)}>Save</button>
                    <button className="cancel-btn" onClick={cancelEdit}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="task-card" key={task.id}>
                  <div className={`priority-badge priority-${task.priority.toLowerCase()}`}>
                    {task.priority}
                  </div>
                  <h3>{task.title}</h3>
                  {task.description && <p>{task.description}</p>}
                  <p className="date">{task.created_at}</p>
                  <div className="card-actions">
                    <select
                      value={col.id}
                      onChange={(e) => handleMove(task.id, Number(e.target.value))}
                    >
                      {board.columns.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <button onClick={() => startEdit(task)}>Edit</button>
                    <button onClick={() => handleDelete(task.id)}>Delete</button>
                  </div>
                </div>
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;