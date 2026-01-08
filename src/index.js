/**
 * wabi.js - Add organic geometric imperfection to HTML elements
 *
 * @example
 * // Basic usage with options
 * wabi('#myDiv', { corners: { x: 5, y: 4 } });
 *
 * @example
 * // Shorthand usage
 * wabi('#myDiv', 5, 4);      // corners only
 * wabi('#myDiv', 5, 4, 2);   // corners + 2 edge points
 *
 * @example
 * // With edge points
 * wabi('.cards', {
 *   corners: { x: 3, y: 3 },
 *   edges: { points: 2, edgeWobble: 2 }
 * });
 */

import { Wabi } from "./core/Wabi.js";

/**
 * Apply wabi effect to elements
 * @param {string|Element|NodeList} selector - CSS selector, DOM element, or NodeList
 * @param {object|number} [options] - Options object or corner X offset (shorthand)
 * @param {number} [cornerY] - Corner Y offset (shorthand mode)
 * @param {number} [edgePoints] - Number of edge points (shorthand mode)
 * @returns {object} - Control object with restore, update, setOptions methods
 */
function wabi(selector, options, cornerY, edgePoints) {
  return Wabi.apply(selector, options, cornerY, edgePoints);
}

// Export as default and named export
export { wabi };
export default wabi;
