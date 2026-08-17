const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, '..', '..', 'practices.db');

let db = null;

/**
 * Retorna la connexió a la base de dades.
 * Si no existeix, la crea (initDB s'ha de cridar prèviament).
 * @returns {Database.Database}
 */
function getDB() {
  if (!db) {
    throw new Error('Base de dades no inicialitzada. Crida initDB() primer.');
  }
  return db;
}

/**
 * Inicialitza la base de dades SQLite i crea les taules si no existeixen.
 * Taula `practices`: id, name, description, createdAt, updatedAt
 * Taula `criteria`: id, practiceId, text, createdAt
 */
function initDB() {
  db = new Database(DB_PATH);

  // Force synchronous creation
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = on');

  db.exec(`
    CREATE TABLE IF NOT EXISTS practices (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      createdAt DATETIME NOT NULL DEFAULT (datetime('now')),
      updatedAt DATETIME NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS criteria (
      id TEXT PRIMARY KEY,
      practiceId TEXT NOT NULL,
      text TEXT NOT NULL,
      createdAt DATETIME NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (practiceId) REFERENCES practices(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS submissions (
      hash TEXT PRIMARY KEY,
      practiceId TEXT NOT NULL,
      url TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      result TEXT,
      createdAt DATETIME NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (practiceId) REFERENCES practices(id) ON DELETE CASCADE
    )
  `);

  return db;
}

module.exports = { getDB, initDB };
