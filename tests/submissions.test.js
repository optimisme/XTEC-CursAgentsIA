const assert = require('assert');
const { validateGithubUrl } = require('../src/lib/url-validator');
const {
  createSubmission,
  getSubmission,
  listSubmissions,
} = require('../src/services/submission');
const { initDB } = require('../src/models/db');

// Initialize DB for tests
initDB();

// Test URL validation with submissions
const invalidUrl = validateGithubUrl('http://github.com/test/repo');
assert.strictEqual(invalidUrl.valid, false, 'HTTP URL should be invalid');
console.log('✓ HTTP URL rejected by URL validator in submission context');

const validUrl = validateGithubUrl('https://github.com/nodejs/node');
assert.strictEqual(validUrl.valid, true, 'HTTPS URL should be valid');
assert.strictEqual(validUrl.parsed.owner, 'nodejs');
assert.strictEqual(validUrl.parsed.repo, 'node');
console.log('✓ HTTPS GitHub URL accepted by URL validator');

console.log('\nSubmissions validation tests passed!');
