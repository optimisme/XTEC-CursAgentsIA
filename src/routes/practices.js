const express = require('express');
const { createPractice, getPractice, listPractices, updatePractice, deletePractice } = require('../services/practice');

const router = express.Router();

// POST /api/practices - Create new practice
router.post('/', (req, res) => {
  const { name, description } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Name is required' });
  }

  const practice = createPractice(name.trim(), description);
  res.status(201).json(practice);
});

// GET /api/practices - List all practices
router.get('/', (req, res) => {
  const practices = listPractices();
  res.json(practices);
});

// GET /api/practices/:id - Get practice by ID
router.get('/:id', (req, res) => {
  const practice = getPractice(req.params.id);

  if (!practice) {
    return res.status(404).json({ error: 'Practice not found' });
  }

  res.json(practice);
});

// PUT /api/practices/:id - Update practice
router.put('/:id', (req, res) => {
  const { name, description } = req.body;

  if (name !== undefined && name.trim() !== '') {
    req.body.name = name.trim();
  }

  const practice = updatePractice(req.params.id, req.body);

  if (!practice) {
    return res.status(404).json({ error: 'Practice not found' });
  }

  res.json(practice);
});

// DELETE /api/practices/:id - Delete practice
router.delete('/:id', (req, res) => {
  const deleted = deletePractice(req.params.id);

  if (!deleted) {
    return res.status(404).json({ error: 'Practice not found' });
  }

  res.status(204).send();
});

module.exports = router;
