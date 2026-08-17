/**
 * Validador d'URLs de repositoris GitHub
 *
 * Aquest mòdul proporciona funcions per validar URLs de repositoris
 * de GitHub, assegurant-se que compleixen els requisits:
 * - Esquema HTTPS obligatori
 * - Host github.com exclusivament
 * - Format exacte: /owner/repo (sense camins addicionals)
 */

/**
 * Verifica si una URL fa servir l'esquema HTTPS
 * @param {string} url - L'URL a validar
 * @returns {boolean} - True si l'URL és HTTPS, false altrament
 */
function isHttpsUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Verifica si una URL és de GitHub (host github.com i HTTPS)
 * @param {string} url - L'URL a validar
 * @returns {boolean} - True si l'URL és de GitHub, false altrament
 */
function isGithubUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname === 'github.com' && parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Valida una URL de repositori GitHub completament.
 *
 * Retorna un objecte amb:
 * - valid: boolean - Indica si l'URL és vàlida
 * - parsed: { owner, repo } - Només present si valid és true
 * - error: string - Missatge d'error si valid és false
 *
 * @param {string} url - L'URL a validar
 * @returns {{ valid: boolean, parsed?: { owner: string, repo: string }, error?: string }}
 */
function validateGithubUrl(url) {
  try {
    const parsed = new URL(url);

    // Check protocol
    if (parsed.protocol !== 'https:') {
      return { valid: false, error: 'Schema no HTTPS' };
    }

    // Check host
    if (parsed.hostname !== 'github.com') {
      return { valid: false, error: 'Host no permes' };
    }

    // Must be exactly /owner/repo (nothing more)
    const parts = parsed.pathname.split('/').filter(Boolean);
    if (parts.length !== 2) {
      return {
        valid: false,
        error: 'URL no vàlida. Format esperat: https://github.com/owner/repo',
      };
    }

    const [owner, repo] = parts;

    // Basic validation of owner/repo format
    if (
      !/^[a-zA-Z0-9][a-zA-Z0-9-]*$/.test(owner) ||
      !/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(repo)
    ) {
      return { valid: false, error: 'Format owner/repo no vàlid' };
    }

    return { valid: true, parsed: { owner, repo } };
  } catch (err) {
    return { valid: false, error: 'URL no vàlida: ' + err.message };
  }
}

module.exports = { validateGithubUrl, isGithubUrl, isHttpsUrl };
