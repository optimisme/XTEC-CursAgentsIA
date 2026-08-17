const express = require('express');
const {
  createSubmission,
  getSubmission,
  listSubmissions,
} = require('../services/submission');
const router = express.Router();

// POST /api/submissions - Create new submission
router.post('/', (req, res) => {
  const { practiceId, url } = req.body;

  if (!practiceId) {
    return res.status(400).json({ error: 'practiceId is required' });
  }
  if (!url) {
    return res.status(400).json({ error: 'url is required' });
  }

  const result = createSubmission(practiceId, url);
  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }

  res.status(201).json(result);
});

// GET /api/submissions - List all submissions
router.get('/', (req, res) => {
  const submissions = listSubmissions();
  res.json(submissions);
});

// GET /api/submissions/:hash - Get submission by hash
router.get('/:hash', (req, res) => {
  const submission = getSubmission(req.params.hash);
  if (!submission) {
    return res.status(404).json({ error: 'Submission not found' });
  }
  res.json(submission);
});

// POST /api/submissions/:hash/clone - Clone repository
router.post('/:hash/clone', async (req, res) => {
  try {
    const { hash } = req.params;

    // Get submission
    const submission = getSubmission(hash);
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    if (submission.status !== 'pending' && submission.status !== 'reviewing') {
      return res.status(400).json({ error: 'Submission not in a clonable state' });
    }

    // Check if already cloned
    const { createSubmissionDir, cleanupSubmissionDir } = require('../lib/temp-manager');
    const { isAccessible, cloneRepo } = require('../services/git');

    // Check accessibility first
    const accessibility = await isAccessible(submission.url);
    if (!accessibility.accessible) {
      return res.status(422).json({ error: accessibility.error || 'Repository inaccessible' });
    }

    // Clone the repository
    const repoPath = await createSubmissionDir(hash);
    await cloneRepo(hash, submission.url, repoPath);

    // Update status
    const { getDB } = require('../models/db');
    const db = getDB();
    db.prepare('UPDATE submissions SET status = ? WHERE hash = ?').run('cloned', hash);

    res.json({
      hash,
      status: 'cloned',
      path: repoPath,
      url: submission.url,
    });
  } catch (err) {
    console.error('Clone error:', err);
    res.status(500).json({ error: 'Cloning failed: ' + err.message });
  }
});

// POST /api/submissions/:hash/cleanup - Manual cleanup
router.post('/:hash/cleanup', async (req, res) => {
  try {
    const { hash } = req.params;

    // Get submission
    const submission = getSubmission(hash);
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Cleanup the directory
    const { cleanupSubmissionDir } = require('../lib/temp-manager');
    await cleanupSubmissionDir(hash);

    // Update status back to pending
    const { getDB } = require('../models/db');
    const db = getDB();
    db.prepare('UPDATE submissions SET status = ? WHERE hash = ?').run('pending', hash);

    res.json({ hash, status: 'pending', message: 'Cleanup completed' });
  } catch (err) {
    console.error('Cleanup error:', err);
    res.status(500).json({ error: 'Cleanup failed: ' + err.message });
  }
});

module.exports = router;
