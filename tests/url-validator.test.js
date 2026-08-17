const assert = require('assert');
const { validateGithubUrl } = require('../src/lib/url-validator');

// Test 1: Valid GitHub URL
const result1 = validateGithubUrl('https://github.com/owner/repo');
assert.strictEqual(result1.valid, true);
assert.strictEqual(result1.parsed.owner, 'owner');
assert.strictEqual(result1.parsed.repo, 'repo');

// Test 2: URL with path (invalid)
const result2 = validateGithubUrl('https://github.com/owner/repo/tree/main');
assert.strictEqual(result2.valid, false);

// Test 3: SSH Git URL (invalid)
const result3 = validateGithubUrl('git@github.com:owner/repo.git');
assert.strictEqual(result3.valid, false);

// Test 4: Wrong host (invalid)
const result4 = validateGithubUrl('https://gitlab.com/owner/repo');
assert.strictEqual(result4.valid, false);
assert.strictEqual(result4.error, 'Host no permes');

// Test 5: HTTP scheme (invalid)
const result5 = validateGithubUrl('http://github.com/owner/repo');
assert.strictEqual(result5.valid, false);
assert.strictEqual(result5.error, 'Schema no HTTPS');

console.log('All url-validator tests passed!');
