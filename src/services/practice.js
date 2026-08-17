const { getDB, initDB } = require('../models/db');
const crypto = require('crypto');

function createPractice(name, description) {
  initDB();
  const db = getDB();
  const id = crypto.randomUUID();
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

  const stmt = db.prepare(
    'INSERT INTO practices (id, name, description, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)'
  );
  stmt.run(id, name, description || null, now, now);

  return getPractice(id);
}

function getPractice(id) {
  initDB();
  const db = getDB();

  const row = db.prepare('SELECT * FROM practices WHERE id = ?').get(id);
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function listPractices() {
  initDB();
  const db = getDB();

  const rows = db.prepare(
    'SELECT * FROM practices ORDER BY createdAt DESC'
  ).all();

  return rows.map(row => ({
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

function updatePractice(id, updates) {
  initDB();
  const db = getDB();

  const existing = getPractice(id);
  if (!existing) return null;

  const name = updates.name !== undefined ? updates.name : existing.name;
  const description = updates.description !== undefined ? updates.description : existing.description;
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

  db.prepare('UPDATE practices SET name = ?, description = ?, updatedAt = ? WHERE id = ?').run(name, description, now, id);

  return getPractice(id);
}

function deletePractice(id) {
  initDB();
  const db = getDB();

  const existing = getPractice(id);
  if (!existing) return false;

  const result = db.prepare('DELETE FROM practices WHERE id = ?').run(id);
  return result.changes > 0;
}

module.exports = { createPractice, getPractice, listPractices, updatePractice, deletePractice };
