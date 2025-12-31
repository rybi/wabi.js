/**
 * Normalize various selector inputs into an array of DOM elements
 * @param {string|Element|NodeList|HTMLCollection|Array} selector - The selector input
 * @returns {Element[]} - Array of DOM elements
 */
export function normalizeSelector(selector) {
  // Already an array
  if (Array.isArray(selector)) {
    return selector.filter((el) => el instanceof Element);
  }

  // Single DOM element
  if (selector instanceof Element) {
    return [selector];
  }

  // NodeList or HTMLCollection
  if (selector instanceof NodeList || selector instanceof HTMLCollection) {
    return Array.from(selector);
  }

  // CSS selector string
  if (typeof selector === "string") {
    return Array.from(document.querySelectorAll(selector));
  }

  // Unknown type
  return [];
}
