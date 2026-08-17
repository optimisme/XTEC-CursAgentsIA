const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const config = require('../config');

let tempDirPath = null;

async function getTempDir() {
  if (tempDirPath) return tempDirPath;
  
  const baseDir = config.tempDir;
  await fs.mkdir(baseDir, { recursive: true });
  tempDirPath = baseDir;
  return tempDirPath;
}

async function createSubmissionDir(submissionHash) {
  const safeHash = submissionHash.replace(/[^a-zA-Z0-9_-]/g, '');
  if (submissionHash.includes('..') || submissionHash.includes('/')) {
    throw new Error('Invalid submission hash: path traversal detected');
  }
  
  const tempBase = await getTempDir();
  const dirPath = path.join(tempBase, safeHash);
  await fs.mkdir(dirPath, { recursive: true });
  return dirPath;
}

async function cleanupSubmissionDir(submissionHash) {
  try {
    const safeHash = submissionHash.replace(/[^a-zA-Z0-9_-]/g, '');
    if (submissionHash.includes('..') || submissionHash.includes('/')) {
      return; // Don't throw, just skip
    }
    const tempBase = await getTempDir();
    const dirPath = path.join(tempBase, safeHash);
    await fs.rm(dirPath, { recursive: true, force: true });
  } catch (err) {
    // Ignore errors if directory doesn't exist
  }
}

async function cleanupAll() {
  const baseDir = config.tempDir;
  await fs.mkdir(baseDir, { recursive: true });
  const entries = await fs.readdir(baseDir);
  for (const entry of entries) {
    await fs.rm(path.join(baseDir, entry), { recursive: true, force: true });
  }
}

module.exports = { getTempDir, createSubmissionDir, cleanupSubmissionDir, cleanupAll };
