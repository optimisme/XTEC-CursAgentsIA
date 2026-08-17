const assert = require('assert');
const http = require('http');
const { spawn } = require('child_process');
const { initDB } = require('../src/models/db');

initDB();

let server;
let serverUrl;

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request(`${serverUrl}${path}`, {
      method,
      headers: data ? {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      } : {},
    }, res => {
      let rawData = '';
      res.on('data', chunk => { rawData += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(rawData) });
        } catch {
          resolve({ status: res.statusCode, body: rawData });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function getPracticeId() {
  return new Promise((resolve) => {
    const req = http.get(`${serverUrl}/api/practices`, res => {
      let rawData = '';
      res.on('data', chunk => { rawData += chunk; });
      res.on('end', () => {
        const practices = JSON.parse(rawData);
        if (practices.length > 0) {
          resolve(practices[0].id);
        } else {
          resolve(null);
        }
      });
    });
    req.on('error', () => resolve(null));
  });
}

(async () => {
  let passed = 0;
  let failed = 0;

  // Start server for integration tests
  server = spawn('node', ['src/server.js'], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: 3099 },
  });

  await new Promise(resolve => setTimeout(resolve, 2000));
  serverUrl = 'http://localhost:3099';

  // Test 1: GET /api/submissions/:hash/nonexistent → 404
  const t1 = await request('GET', '/api/submissions/nonexistent');
  try {
    assert.strictEqual(t1.status, 404);
    assert.ok(t1.body.error);
    passed++;
    console.log('✓ Test 1: GET /api/submissions/:hash/nonexistent → 404');
  } catch (err) {
    failed++;
    console.log(`✗ Test 1: ${err.message}`);
  }

  // Test 2: POST /api/submissions/:hash/cleanup non-existent → 404
  const t2 = await request('POST', '/api/submissions/nonexistent/cleanup');
  try {
    assert.strictEqual(t2.status, 404);
    assert.ok(t2.body.error);
    passed++;
    console.log('✓ Test 2: POST /api/submissions/:hash/cleanup non-existent → 404');
  } catch (err) {
    failed++;
    console.log(`✗ Test 2: ${err.message}`);
  }

  // Test 3: POST /api/submissions/:hash/clone non-existent → 404
  const t3 = await request('POST', '/api/submissions/nonexistent/clone');
  try {
    assert.strictEqual(t3.status, 404);
    assert.ok(t3.body.error);
    passed++;
    console.log('✓ Test 3: POST /api/submissions/:hash/clone non-existent → 404');
  } catch (err) {
    failed++;
    console.log(`✗ Test 3: ${err.message}`);
  }

  // Test 4: Cleanup on non-cloned submission should work and return 200
  try {
    const practiceId = await getPracticeId();
    if (practiceId) {
      // Get first submission (already in DB from prior runs)
      const submissions = await request('GET', '/api/submissions');
      if (submissions.body.length > 0) {
        const hash = submissions.body[0].hash;
        const cleanupResult = await request('POST', `/api/submissions/${hash}/cleanup`);
        assert.strictEqual(cleanupResult.status, 200);
        assert.strictEqual(cleanupResult.body.status, 'pending');
        assert.ok(cleanupResult.body.message);
        passed++;
        console.log('✓ Test 4: POST /api/submissions/:hash/cleanup on existing submission → 200');
      } else {
        // Create a submission just for cleanup
        const createSub = await request('POST', '/api/submissions', {
          practiceId,
          url: 'https://github.com/octocat/Hello-World',
        });
        assert.strictEqual(createSub.status, 201);
        const hash = createSub.body.hash;
        
        const cleanupResult = await request('POST', `/api/submissions/${hash}/cleanup`);
        assert.strictEqual(cleanupResult.status, 200);
        assert.strictEqual(cleanupResult.body.status, 'pending');
        assert.ok(cleanupResult.body.message);
        passed++;
        console.log('✓ Test 4: POST /api/submissions/:hash/cleanup creates and cleans up → 200');
      }
    } else {
      // No practices exist, skip
      failed++;
      console.log('✗ Test 4: No practices found in test database');
    }
  } catch (err) {
    failed++;
    console.log(`✗ Test 4: ${err.message}`);
  }

  // Test 5: GET /api/submissions/:hash/clone returns 404
  const t5 = await request('POST', '/api/submissions/nonexistent/clone');
  try {
    assert.strictEqual(t5.status, 404);
    assert.ok(t5.body.error);
    passed++;
    console.log('✓ Test 5: POST /api/submissions/:hash/clone returns 404');
  } catch (err) {
    failed++;
    console.log(`✗ Test 5: ${err.message}`);
  }

  // Test 6: GET /api/submissions returns array
  const t6 = await request('GET', '/api/submissions');
  try {
    assert.strictEqual(t6.status, 200);
    assert.ok(Array.isArray(t6.body));
    passed++;
    console.log('✓ Test 6: GET /api/submissions returns array with status ' + t6.status);
  } catch (err) {
    failed++;
    console.log(`✗ Test 6: ${err.message}`);
  }

  // Stop server
  server.kill('SIGTERM');
  await new Promise(resolve => setTimeout(resolve, 500));

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
  console.log('All submission tests passed!');
})();
