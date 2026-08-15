const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
async function handleResponse(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Something went wrong');
  }
  if (res.status === 204) return null; // DELETE has no body
  return res.json();
}

export async function getBoard(priority) {
  const url = priority ? `${BASE_URL}/board?priority=${priority}` : `${BASE_URL}/board`;
  const res = await fetch(url);
  return handleResponse(res);
}

export async function createTask(task) {
  const res = await fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });
  return handleResponse(res);
}

export async function updateTask(id, task) {
  const res = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });
  return handleResponse(res);
}

export async function moveTask(id, column_id) {
  const res = await fetch(`${BASE_URL}/tasks/${id}/move`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ column_id }),
  });
  return handleResponse(res);
}

export async function deleteTask(id) {
  const res = await fetch(`${BASE_URL}/tasks/${id}`, { method: 'DELETE' });
  return handleResponse(res);
}