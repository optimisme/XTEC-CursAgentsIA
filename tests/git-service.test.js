const assert = require('assert');
const path = require('path');
const fs = require('fs').promises;
const { cloneRepo, isAccessible, cleanupRepo } = require('../src/services/git');
const { getTempDir, cleanupAll } = require('../src/lib/temp-manager');

async function runTests() {
  let passed = 0;
  let failed = 0;

  // Test 1: isAccessible with public repo
  try {
    const result = await isAccessible('https://github.com/nodejs/node');
    assert.strictEqual(result.accessible, true, 'Public repo should be accessible');
    assert.ok(result.error === null, 'Should have no error for accessible repo');
    console.log('✓ Test 1: isAccessible public repo');
    passed++;
  } catch (err) {
    console.error('✗ Test 1 FAILED:', err.message);
    failed++;
  }

  // Test 2: isAccessible with non-existent repo
  try {
    const result = await isAccessible(
      'https://github.com/invaliduser/repo-that-does-not-exist-xyz'
    );
    assert.strictEqual(result.accessible, false, 'Non-existent repo should not be accessible');
    assert.ok(result.error === 'Repository not found', 'Should report repo not found');
    console.log('✓ Test 2: isAccessible non-existent repo');
    passed++;
  } catch (err) {
    console.error('✗ Test 2 FAILED:', err.message);
    failed++;
  }

  // Test 3: isAccessible with invalid URL
  try {
    const result = await isAccessible('not-a-url');
    assert.strictEqual(result.accessible, false, 'Invalid URL should not be accessible');
    assert.ok(result.error !== null, 'Should have error for invalid URL');
    console.log('✓ Test 3: isAccessible invalid URL');
    passed++;
  } catch (err) {
    console.error('✗ Test 3 FAILED:', err.message);
    failed++;
  }

  // Test 4: Path traversal in cloneRepo
  try {
    let errorCaught = false;
    try {
      await cloneRepo('test', 'https://github.com/test/repo', '/tmp/../../../etc');
    } catch (err) {
      errorCaught = true;
      assert.ok(err.message.includes('Path traversal'), 'Should detect path traversal');
    }
    assert.ok(errorCaught, 'cloneRepo should reject path traversal attempts');
    console.log('✓ Test 4: Path traversal detected in cloneRepo');
    passed++;
  } catch (err) {
    console.error('✗ Test 4 FAILED:', err.message);
    failed++;
  }

  // Test 5: Path outside tempDir rejected in cloneRepo
  try {
    let errorCaught = false;
    try {
      await cloneRepo('test', 'https://github.com/test/repo', '/var/something/else');
    } catch (err) {
      errorCaught = true;
      assert.ok(
        err.message.includes('Invalid path') || err.message.includes('temp directory'),
        'Should reject paths outside tempDir'
      );
    }
    assert.ok(errorCaught, 'cloneRepo should reject paths outside tempDir');
    console.log('✓ Test 5: Path outside tempDir rejected in cloneRepo');
    passed++;
  } catch (err) {
    console.error('✗ Test 5 FAILED:', err.message);
    failed++;
  }

  // Test 6: cleanupRepo removes directory
  try {
    const tempBase = await getTempDir();
    const cleanupDir = path.join(tempBase, 'cleanup-test-' + Date.now());
    await fs.mkdir(cleanupDir, { recursive: true });
    await fs.writeFile(path.join(cleanupDir, 'test.txt'), 'test content');

    // Verify directory exists before cleanup
    const existsBefore = await fs.stat(cleanupDir).then(() => true).catch(() => false);
    assert.ok(existsBefore, 'Directory should exist before cleanup');

    // Cleanup and verify
    await cleanupRepo(cleanupDir);
    const existsAfter = await fs.stat(cleanupDir).then(() => true).catch(() => false);
    assert.ok(!existsAfter, 'Directory should not exist after cleanup');
    console.log('✓ Test 6: cleanupRepo removes directory');
    passed++;
  } catch (err) {
    console.error('✗ Test 6 FAILED:', err.message);
    failed++;
  }

  // Test 7: cleanupRepo handles non-existent directory gracefully
  try {
    const tempBase = await getTempDir();
    const nonExistentPath = path.join(tempBase, 'does-not-exist-' + Date.now());
    // Should not throw
    await cleanupRepo(nonExistentPath);
    console.log('✓ Test 7: cleanupRepo handles non-existent directory');
    passed++;
  } catch (err) {
    console.error('✗ Test 7 FAILED:', err.message);
    failed++;
  }

  // Final cleanup
  await cleanupAll();

  console.log('');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('Test runner error:', err);
  process.exit(1);
});
