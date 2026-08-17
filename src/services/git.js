const { execFile } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const config = require('../config');

const execFileAsync = promisify(execFile);

/**
 * Clona un repositori GitHub de manera segura dins del directori temporal.
 *
 * Utilitza execFile per evitar injecció de comandes shell i estableix
 * variables d'entorn per desactivar qualsevol interacció per terminal.
 *
 * @param {string} submissionHash - Hash de l'entrega (només per context)
 * @param {string} repoUrl - URL completa del repositori (https://github.com/owner/repo)
 * @param {string} repoPath - Ruta absoluta on clonar el repositori
 * @returns {Promise<{cloned: boolean, path: string}>}
 */
async function cloneRepo(submissionHash, repoUrl, repoPath) {
  // Validate path doesn't contain path traversal sequences
  if (repoPath.includes('..') || repoPath.includes('\0')) {
    throw new Error('Path traversal detected or invalid path');
  }

  // Normalize and verify path is within tempDir
  const normalizedRepoPath = path.normalize(repoPath);
  if (!normalizedRepoPath.startsWith(config.tempDir)) {
    throw new Error('Invalid path: must be within temp directory');
  }

  // Create the directory first
  await fs.mkdir(normalizedRepoPath, { recursive: true });

  // Disable terminal prompts and authentication dialogs
  const env = {
    ...process.env,
    GIT_TERMINAL_PROMPT: '0',
    GIT_ASKPASS: 'echo',
  };

  // Use execFile to avoid shell injection
  await execFileAsync(
    'git',
    ['clone', '--depth', '1', '--no-checkout', '--', repoUrl, normalizedRepoPath],
    { env, timeout: 30000 }
  );

  return { cloned: true, path: normalizedRepoPath };
}

/**
 * Verifica si un repositori GitHub és accessible (públic o amb credencials).
 *
 * Utilitza l'API de GitHub (HEAD /repos/:owner/:repo) per comprovar
 * l'accés sense baixar contingut.
 *
 * @param {string} repoUrl - URL del repositori (https://github.com/owner/repo)
 * @param {number} timeoutMs - Temps màxim en mil·lisegons (default: 5000)
 * @returns {Promise<{accessible: boolean, error: string|null}>}
 */
async function isAccessible(repoUrl, timeoutMs = 5000) {
  try {
    const parsedUrl = new URL(repoUrl);

    // Extract owner/repo from github.com URL
    const [owner, repo] = parsedUrl.pathname
      .split('/')
      .filter(Boolean);
    if (!owner || !repo) {
      return { accessible: false, error: 'Invalid repository URL' };
    }

    return new Promise((resolve) => {
      const req = https.request(
        {
          hostname: 'api.github.com',
          path: `/repos/${owner}/${repo}`,
          method: 'HEAD',
          headers: { 'User-Agent': 'xtec-submission-validator' },
          timeout: timeoutMs,
        },
        (res) => {
          resolve({
            accessible: res.statusCode === 200,
            error: res.statusCode === 404 ? 'Repository not found' : null,
          });
        }
      );

      req.on('error', () =>
        resolve({ accessible: false, error: 'Connection failed' })
      );
      req.on('timeout', () => {
        req.destroy();
        resolve({ accessible: false, error: 'Timeout' });
      });

      req.end();
    });
  } catch (err) {
    return { accessible: false, error: err.message };
  }
}

/**
 * Neteja (elimina) un directori de repositori clonat.
 *
 * @param {string} repoPath - Ruta del directori a eliminar
 * @returns {Promise<void>}
 */
async function cleanupRepo(repoPath) {
  try {
    await fs.rm(repoPath, { recursive: true, force: true });
  } catch (err) {
    // Ignore if doesn't exist
  }
}

module.exports = { cloneRepo, isAccessible, cleanupRepo };
