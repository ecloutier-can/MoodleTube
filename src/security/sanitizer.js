/**
 * Escapes characters for HTML content to prevent XSS.
 * @param {string} str - The raw input string.
 * @returns {string} - The safely escaped string.
 */
export const escapeHtml = (str) => {
  if (typeof str !== 'string') return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return str.replace(/[&<>"']/g, function(m) { return map[m]; });
};

/**
 * Sanitizes an object of configuration data.
 * @param {object} config - The raw configuration object.
 * @returns {object} - The sanitized configuration.
 */
export const sanitizeConfig = (config) => {
  const sanitized = { ...config };
  if (sanitized.title) sanitized.title = escapeHtml(sanitized.title);
  if (sanitized.itemTitle) sanitized.itemTitle = escapeHtml(sanitized.itemTitle);
  if (sanitized.interactions) {
    sanitized.interactions = sanitized.interactions.map(interaction => ({
      ...interaction,
      message: escapeHtml(interaction.message)
    }));
  }
  return sanitized;
};
