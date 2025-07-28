// server/utils/sanitizeHtml.js
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

// Create a DOM window for DOMPurify
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

/**
 * Sanitize incoming HTML using DOMPurify
 * @param {string} dirtyHtml
 * @returns {string} sanitized HTML
 */
function sanitizeHtml(dirtyHtml) {
  return DOMPurify.sanitize(dirtyHtml || "");
}

module.exports = sanitizeHtml;
