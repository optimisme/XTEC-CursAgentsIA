const { getDB, initDB } = require('../models/db');
const crypto = require('crypto');
const { getPractice } = require('./practice');

function createCriterion(practiceId, text) {
  initDB();
  const db = getDB();

  const practice = getPractice(practiceId);
  if (!practice) return null;

  if (!text || text.trim() === '') {
    return null;
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

  const stmt = db.prepare(
    'INSERT INTO criteria (id, practiceId, text, createdAt) VALUES (?, ?, ?, ?)'
  );
  stmt.run(id, practiceId, text.trim(), now);

  return getCriterion(id);
}

function getCriterion(id) {
  initDB();
  const db = getDB();

  const row = db.prepare('SELECT * FROM criteria WHERE id = ?').get(id);
  if (!row) return null;

  return {
    id: row.id,
    practiceId: row.practiceId,
    text: row.text,
    createdAt: row.createdAt,
  };
}

function listCriteria(practiceId) {
  initDB();
  const db = getDB();

  const rows = db.prepare(
    'SELECT * FROM criteria WHERE practiceId = ? ORDER BY createdAt ASC'
  ).all(practiceId);

  return rows.map(row => ({
    id: row.id,
    practiceId: row.practiceId,
    text: row.text,
    createdAt: row.createdAt,
  }));
}

function updateCriterion(id, updates) {
  initDB();
  const db = getDB();

  const existing = getCriterion(id);
  if (!existing) return null;

  const text = updates.text !== undefined ? updates.text.trim() : existing.text;

  if (text === '') {
    return null;
  }

  db.prepare('UPDATE criteria SET text = ? WHERE id = ?').run(text, id);

  return getCriterion(id);
}

function deleteCriterion(id) {
  initDB();
  const db = getDB();

  const existing = getCriterion(id);
  if (!existing) return false;

  const result = db.prepare('DELETE FROM criteria WHERE id = ?').run(id);
  return result.changes > 0;
}

module.exports = { createCriterion, getCriterion, listCriteria, updateCriterion, deleteCriterion };
