/**
 * Convert a value to pixels based on element dimension
 * @param {number} value - The value to convert
 * @param {number} dimension - The element dimension (width or height)
 * @param {string} unit - The unit type ('px' or '%')
 * @returns {number} - Value in pixels
 */
export function toPixels(value, dimension, unit) {
  if (unit === "%") {
    return (value / 100) * dimension;
  }
  return value;
}

/**
 * Convert a pixel value to percentage
 * @param {number} value - The value in pixels
 * @param {number} dimension - The element dimension (width or height)
 * @returns {number} - Value as percentage
 */
export function toPercent(value, dimension) {
  return (value / dimension) * 100;
}

/**
 * Format a point for clip-path string
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {string} unit - Unit type ('px' or '%')
 * @returns {string} - Formatted point string
 */
export function formatPoint(x, y, unit) {
  if (unit === "px") {
    return `${x.toFixed(2)}px ${y.toFixed(2)}px`;
  }
  return `${x.toFixed(2)}% ${y.toFixed(2)}%`;
}
