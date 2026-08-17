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

module.exports = router;
