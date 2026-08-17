const { getDB, initDB } = require('../models/db');
const crypto = require('crypto');
const { getPractice } = require('./practice');
const { validateGithubUrl } = require('../lib/url-validator');

function createSubmission(practiceId, url) {
  initDB();
  const db = getDB();

  // Validate practice exists
  const practice = getPractice(practiceId);
  if (!practice) return { error: 'Practice not found', status: 404 };

  // Validate URL
  const urlValidation = validateGithubUrl(url);
  if (!urlValidation.valid) {
    return { error: urlValidation.error, status: 400 };
  }

  // Generate hash from URL
  const hash = crypto
    .createHash('sha256')
    .update(url)
    .digest('hex')
    .slice(0, 16);

  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

  const stmt = db.prepare(
    'INSERT INTO submissions (hash, practiceId, url, status, createdAt) VALUES (?, ?, ?, ?, ?)'
  );
  stmt.run(hash, practiceId, url, 'pending', now);

  return { hash, practiceId, url, status: 'pending', createdAt: now };
}

function getSubmission(hash) {
  initDB();
  const db = getDB();

  const row = db.prepare('SELECT * FROM submissions WHERE hash = ?').get(hash);
  if (!row) return null;

  return {
    hash: row.hash,
    practiceId: row.practiceId,
    url: row.url,
    status: row.status,
    result: row.result,
    createdAt: row.createdAt,
  };
}

function listSubmissions() {
  initDB();
  const db = getDB();

  const rows = db
    .prepare('SELECT * FROM submissions ORDER BY createdAt DESC')
    .all();

  return rows.map((row) => ({
    hash: row.hash,
    practiceId: row.practiceId,
    url: row.url,
    status: row.status,
    result: row.result,
    createdAt: row.createdAt,
  }));
}

module.exports = { createSubmission, getSubmission, listSubmissions };
