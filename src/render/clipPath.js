import { formatPoint } from "../utils/units.js";

/**
 * Generate a CSS clip-path polygon string from points
 * @param {Array<{x: number, y: number}>} points - Array of polygon points
 * @param {string} unit - Unit type ('px' or '%')
 * @returns {string} - CSS clip-path value
 */
export function generateClipPath(points, unit = "%") {
  const pointStrings = points.map((p) => formatPoint(p.x, p.y, unit));
  return `polygon(${pointStrings.join(", ")})`;
}
