const assert = require('assert');
const fs = require('fs').promises;
const path = require('path');
const { getTempDir, createSubmissionDir, cleanupSubmissionDir, cleanupAll } = require('../src/lib/temp-manager');

let tempDirPath = null;
let testHash = 'test-hash-' + Date.now();

async function runTests() {
  let passed = 0;
  let failed = 0;

  // Ensure cleanup before tests
  await cleanupAll();

  // Test 1: getTempDir() returns existing path
  try {
    const dirPath = await getTempDir();
    assert.ok(dirPath, 'getTempDir should return a path');
    assert.ok(typeof dirPath === 'string', 'getTempDir should return a string');
    // Verify the directory exists
    const stats = await fs.stat(dirPath);
    assert.ok(stats.isDirectory(), 'getTempDir should return an existing directory path');
    tempDirPath = dirPath;
    console.log('✓ Test 1: getTempDir() returns existing path');
    passed++;
  } catch (err) {
    console.error('✗ Test 1 FAILED:', err.message);
    failed++;
  }

  // Test 2: createSubmissionDir() creates directory
  try {
    const hash = 'test-hash-' + Date.now();
    const dirPath = await createSubmissionDir(hash);
    const stats = await fs.stat(dirPath);
    assert.ok(stats.isDirectory(), 'createSubmissionDir should create an existing directory');
    assert.strictEqual(dirPath, path.join(tempDirPath, hash), 'createSubmissionDir should return correct path');
    console.log('✓ Test 2: createSubmissionDir() creates directory');
    passed++;
    // Clean up this directory
    await cleanupSubmissionDir(hash);
  } catch (err) {
    console.error('✗ Test 2 FAILED:', err.message);
    failed++;
  }

  // Test 3: cleanupSubmissionDir() removes directory
  try {
    const hash = 'test-hash-' + Date.now();
    await createSubmissionDir(hash);
    const dirPath = path.join(tempDirPath, hash);
    const existsBefore = await fs.stat(dirPath).then(() => true).catch(() => false);
    assert.ok(existsBefore, 'Directory should exist before cleanup');
    await cleanupSubmissionDir(hash);
    const existsAfter = await fs.stat(dirPath).then(() => true).catch(() => false);
    assert.ok(!existsAfter, 'Directory should not exist after cleanup');
    console.log('✓ Test 3: cleanupSubmissionDir() removes directory');
    passed++;
  } catch (err) {
    console.error('✗ Test 3 FAILED:', err.message);
    failed++;
  }

  // Test 4: cleanupAll() empties tempDir
  try {
    const hash1 = 'test-hash-' + Date.now();
    const hash2 = 'test-hash-' + (Date.now() + 1);
    await createSubmissionDir(hash1);
    await createSubmissionDir(hash2);
    // Verify both directories exist
    const exists1 = await fs.stat(path.join(tempDirPath, hash1)).then(() => true).catch(() => false);
    const exists2 = await fs.stat(path.join(tempDirPath, hash2)).then(() => true).catch(() => false);
    assert.ok(exists1, 'test1 directory should exist before cleanupAll');
    assert.ok(exists2, 'test2 directory should exist before cleanupAll');
    
    await cleanupAll();
    
    // Verify directories are gone
    const afterExists1 = await fs.stat(path.join(tempDirPath, hash1)).then(() => true).catch(() => false);
    const afterExists2 = await fs.stat(path.join(tempDirPath, hash2)).then(() => true).catch(() => false);
    assert.ok(!afterExists1, 'test1 directory should not exist after cleanupAll');
    assert.ok(!afterExists2, 'test2 directory should not exist after cleanupAll');
    console.log('✓ Test 4: cleanupAll() empties tempDir');
    passed++;
  } catch (err) {
    console.error('✗ Test 4 FAILED:', err.message);
    failed++;
  }

  // Test 5: Path traversal is rejected
  try {
    const maliciousHash = '../malicious/path';
    let errorCaught = false;
    try {
      await createSubmissionDir(maliciousHash);
    } catch (err) {
      errorCaught = true;
      assert.ok(err.message.includes('path traversal'), 'Error should mention path traversal');
    }
    assert.ok(errorCaught, 'createSubmissionDir should reject path traversal attempts');
    console.log('✓ Test 5: Path traversal is rejected');
    passed++;
  } catch (err) {
    console.error('✗ Test 5 FAILED:', err.message);
    failed++;
  }

  // Final cleanup
  await cleanupAll();

  console.log('');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
