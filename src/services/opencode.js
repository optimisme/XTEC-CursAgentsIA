const { spawn } = require('child_process');

const projectRoot = require('path').resolve(__dirname, '..', '..');
const runtimeConfigPath = require('path').join(projectRoot, 'runtime-opencode');

/**
 * Executa l'agent runtime de revisió d'OpenCode de manera no interactiva.
 *
 * Aquesta funció invoque OpenCode en mode no interactiu, establint:
 * - OPENCODE_CONFIG apuntant al directori runtime-opencode/
 * - PWD al directori del repositori clonat (workingDir)
 * - Agent explícit: --agent reviewer
 *
 * El servidor Node.js **no crida APIs de model directament**.
 * Tot el raonament de revisió resideix a l'arnès OpenCode runtime.
 *
 * @param {string} submissionHash - Hash de l'entrega (context per a la pràctica)
 * @param {string} criterionId - Identificador del criteri a validar
 * @param {string} criterionText - Text del criteri a validar
 * @param {string} workingDir - Directori del repositori clonat (direcció de treball)
 * @param {object} options - Opcions addicionals
 * @param {number} options.timeoutMs - Timeout en ms (per defecte 60000)
 * @param {string} options.binaryPath - Ruta alternativa a l'executable OpenCode
 * @returns {Promise<{stdout: string, stderr: string, exitCode: number|null, error: string|null, timedOut: boolean}>}
 */
async function runReviewer(
  submissionHash,
  criterionId,
  criterionText,
  workingDir,
  options = {}
) {
  const {
    timeoutMs = 60000,
    binaryPath = 'opencode',
  } = options;

  // Validate inputs
  if (!submissionHash || typeof submissionHash !== 'string') {
    return {
      stdout: '',
      stderr: '',
      exitCode: null,
      error: 'Invalid or missing submissionHash parameter',
      timedOut: false,
    };
  }

  if (!criterionId || typeof criterionId !== 'string') {
    return {
      stdout: '',
      stderr: '',
      exitCode: null,
      error: 'Invalid or missing criterionId parameter',
      timedOut: false,
    };
  }

  if (!criterionText || typeof criterionText !== 'string') {
    return {
      stdout: '',
      stderr: '',
      exitCode: null,
      error: 'Invalid or missing criterionText parameter',
      timedOut: false,
    };
  }

  if (!workingDir || typeof workingDir !== 'string') {
    return {
      stdout: '',
      stderr: '',
      exitCode: null,
      error: 'Invalid or missing workingDir parameter',
      timedOut: false,
    };
  }

  // Extract practiceId from submissionHash context
  const practiceId = submissionHash;

  // Build the prompt specific to this criterion
  const prompt = [
    `Practice ID: ${practiceId}`,
    `Criterion ID: ${criterionId}`,
    `Criterion text: ${criterionText}`,
    '',
    'Inspect the repository in the current working directory and evaluate',
    'whether the code satisfies the criterion. Return a structured JSON',
    'response with status, evidence, and feedback.',
  ].join('\n');

  // Set up environment variables
  const env = {
    ...process.env,
    OPENCODE_CONFIG: runtimeConfigPath,
    PWD: workingDir,
    GIT_TERMINAL_PROMPT: '0',
    NO_COLOR: '1',
  };

  let killed = false;
  let childProcess = null;
  let killTimer = null;

  return new Promise((resolve) => {
    childProcess = spawn(
      binaryPath,
      [
        '--agent',
        'reviewer',
        '-p',
        prompt,
      ],
      {
        env,
        cwd: workingDir,
        stdio: ['pipe', 'pipe', 'pipe'],
      }
    );

    const stdoutChunks = [];
    const stderrChunks = [];

    childProcess.stdout.on('data', (chunk) => {
      stdoutChunks.push(chunk);
    });

    childProcess.stderr.on('data', (chunk) => {
      stderrChunks.push(chunk);
    });

    childProcess.on('close', (code, signal) => {
      if (killTimer) {
        clearTimeout(killTimer);
        killTimer = null;
      }

      if (killed) {
        resolve({
          stdout: Buffer.concat(stdoutChunks).toString('utf8'),
          stderr: Buffer.concat(stderrChunks).toString('utf8'),
          exitCode: code,
          error: `Process was terminated${signal ? ` by signal ${signal}` : ''}`,
          timedOut: killed,
        });
      } else {
        resolve({
          stdout: Buffer.concat(stdoutChunks).toString('utf8'),
          stderr: Buffer.concat(stderrChunks).toString('utf8'),
          exitCode: code,
          error: null,
          timedOut: false,
        });
      }
    });

    childProcess.on('error', (err) => {
      if (killTimer) {
        clearTimeout(killTimer);
        killTimer = null;
      }

      const isSpawnError = err.code === 'ENOENT' || err.code === 'EACCES';
      resolve({
        stdout: '',
        stderr: err.message,
        exitCode: null,
        error: isSpawnError
          ? `OpenCode binary not found or not executable: ${err.message}. Ensure opencode is installed and in PATH.`
          : `Failed to spawn OpenCode process: ${err.message}`,
        timedOut: false,
      });
    });

    // Set up timeout
    killTimer = setTimeout(() => {
      killed = true;
      if (childProcess && !childProcess.killed) {
        childProcess.kill('SIGKILL');
      }
    }, timeoutMs);
  });
}

module.exports = { runReviewer };
