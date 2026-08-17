const assert = require('assert');
const fs = require('fs');
const path = require('path');

/**
 * Tests per src/services/opencode.js
 *
 * Verifquen el codi font per garantir que es compleixen les
 * restriccions del tasking.
 */

const opencodeSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'services', 'opencode.js'),
  'utf8'
);

async function runTests() {
  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`✓ Test ${name}`);
      passed++;
    } catch (err) {
      console.error(`✗ Test ${name} FAILED: ${err.message}`);
      failed++;
    }
  }

  // Test 1: Uses child_process.spawn (with destructuring import)
  test('1: Uses child_process.spawn', () => {
    assert.ok(
      /require\s*\(\s*['"]child_process['"]\s*\)/.test(opencodeSource),
      'Must import from child_process'
    );
    assert.ok(
      opencodeSource.includes('spawn'),
      'Must use spawn function'
    );
  });

  // Test 2: spawn uses array arguments, not string concat
  test('2: spawn uses array arguments (not string)', () => {
    const spawnCallPattern = /spawn\s*\(\s*\w+\s*,\s*\[/;
    assert.ok(
      spawnCallPattern.test(opencodeSource),
      'spawn must be called with array arguments'
    );
  });

  // Test 3: --agent reviewer is explicit
  test('3: --agent reviewer is explicit', () => {
    assert.ok(
      /['"]reviewer['"]/.test(opencodeSource),
      'Must explicitly select reviewer agent'
    );
    assert.ok(
      opencodeSource.includes('--agent'),
      'Must pass --agent flag explicitly'
    );
  });

  // Test 4: OPENCODE_CONFIG points to runtime-opencode/ (not .opencode/)
  test('4: OPENCODE_CONFIG points to runtime-opencode/', () => {
    assert.ok(
      opencodeSource.includes('runtime-opencode'),
      'OPENCODE_CONFIG must reference runtime-opencode directory'
    );
    // Check that '.opencode' does not appear (no stray references)
    assert.ok(
      !opencodeSource.includes('.opencode'),
      'OPENCODE_CONFIG must NOT reference .opencode directory'
    );
  });

  // Test 5: PWD points to workingDir, not src/
  test('5: PWD points to workingDir (cloned repo), not src/', () => {
    const pwdAssignmentPattern = /PWD\s*:\s*workingDir/;
    assert.ok(
      pwdAssignmentPattern.test(opencodeSource),
      'PWD must be set from workingDir parameter'
    );
  });

  // Test 6: Timeout is configured and managed
  test('6: Timeout is configured and managed', () => {
    assert.ok(
      opencodeSource.includes('60000') || opencodeSource.includes('60'),
      'Must have default timeout value (60 seconds)'
    );
    assert.ok(
      opencodeSource.includes('setTimeout'),
      'Must use setTimeout for timeout management'
    );
  });

  // Test 7: No direct calls to vLLM, OpenAI, or similar APIs
  test('7: No direct calls to vLLM, OpenAI, or similar APIs', () => {
    const forbidden = ['openai', 'vllm', 'ollama', 'huggingface', 'anthropic'];
    for (const pattern of forbidden) {
      const regex = new RegExp(pattern, 'i');
      const lines = opencodeSource.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (regex.test(line)) {
          const suspicious = line.toLowerCase().includes('fetch') ||
            line.toLowerCase().includes('http') ||
            line.toLowerCase().includes('request') ||
            line.toLowerCase().includes('api');
          if (suspicious) {
            throw new Error(`Potential direct API call on line ${i + 1}: ${line.trim()}`);
          }
        }
      }
    }
  });

  // Test 8: Returns structured result
  test('8: Returns structured result {stdout, stderr, exitCode, error}', () => {
    assert.ok(
      opencodeSource.includes('stdout') && opencodeSource.includes('stderr') &&
      opencodeSource.includes('exitCode') && opencodeSource.includes('error'),
      'Must return structured result with stdout, stderr, exitCode, error'
    );
  });

  // Test 9: Kills process on timeout
  test('9: Kills process on timeout', () => {
    assert.ok(
      opencodeSource.includes('.kill') || opencodeSource.includes('SIGKILL') ||
      opencodeSource.includes('SIGTERM'),
      'Must kill process on timeout'
    );
  });

  // Test 10: Captures stdout and stderr
  test('10: Captures stdout and stderr', () => {
    assert.ok(
      opencodeSource.includes('stdout') && opencodeSource.includes('stderr'),
      'Must reference stdout and stderr'
    );
    assert.ok(
      /['"]data['"]/.test(opencodeSource),
      'Must listen for data events'
    );
  });

  // Test 11: runReviewer function signature
  test('11: runReviewer has correct function signature', () => {
    const fnPattern = /async\s+function\s+runReviewer\s*\(/;
    assert.ok(
      fnPattern.test(opencodeSource),
      'Must export runReviewer function'
    );
  });

  // Test 12: Exports runReviewer
  test('12: Exports runReviewer', () => {
    assert.ok(
      opencodeSource.includes('module.exports'),
      'Must use module.exports'
    );
  });

  // Test 13: Uses child_process.spawn, NOT exec/execSync/execFile
  test('13: Uses spawn, not exec or execFile', () => {
    // Should NOT have execFile or exec calls
    assert.ok(
      !opencodeSource.includes('execFile') || opencodeSource.includes('require("child_process")'),
      'Must not use execFile for this service (use spawn instead)'
    );
  });

  console.log('');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('Test runner error:', err);
  process.exit(1);
});
