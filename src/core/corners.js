import { randomInRange } from "../utils/random.js";

/**
 * Generate the four corner points of a rectangle with random displacement
 * @param {number} width - Element width (100 for percentage mode)
 * @param {number} height - Element height (100 for percentage mode)
 * @param {object} cornerOptions - Corner displacement options
 * @param {number} cornerOptions.x - Max horizontal displacement
 * @param {number} cornerOptions.y - Max vertical displacement
 * @param {boolean} cornerOptions.independent - Whether corners move independently
 * @param {function} rng - Random number generator
 * @returns {Array<{x: number, y: number}>} - Array of 4 corner points [TL, TR, BR, BL]
 */
export function generateCorners(width, height, cornerOptions, rng) {
  const { x: offsetX = 0, y: offsetY = 0, independent = true } = cornerOptions;

  // Base corner positions
  const baseCorners = [
    { x: 0, y: 0 }, // Top-left
    { x: width, y: 0 }, // Top-right
    { x: width, y: height }, // Bottom-right
    { x: 0, y: height }, // Bottom-left
  ];

  if (offsetX === 0 && offsetY === 0) {
    return baseCorners;
  }

  if (independent) {
    // Each corner moves independently
    return baseCorners.map((corner, index) => {
      const dx = randomInRange(rng, -offsetX, offsetX);
      const dy = randomInRange(rng, -offsetY, offsetY);

      return {
        x: clampCornerX(corner.x + dx, index, width, offsetX),
        y: clampCornerY(corner.y + dy, index, height, offsetY),
      };
    });
  } else {
    // Uniform skew - all corners move by the same random amounts
    const dx = randomInRange(rng, -offsetX, offsetX);
    const dy = randomInRange(rng, -offsetY, offsetY);

    return baseCorners.map((corner, index) => ({
      x: clampCornerX(corner.x + dx, index, width, offsetX),
      y: clampCornerY(corner.y + dy, index, height, offsetY),
    }));
  }
}

/**
 * Clamp X coordinate based on which corner it is
 * @param {number} x - X coordinate
 * @param {number} cornerIndex - 0=TL, 1=TR, 2=BR, 3=BL
 * @param {number} width - Element width
 * @param {number} maxOffset - Maximum offset value
 * @returns {number} - Clamped X coordinate
 */
function clampCornerX(x, cornerIndex, width, maxOffset) {
  // Left corners (0, 3) should stay near left edge
  if (cornerIndex === 0 || cornerIndex === 3) {
    return Math.max(0, Math.min(x, maxOffset * 2));
  }
  // Right corners (1, 2) should stay near right edge
  return Math.max(width - maxOffset * 2, Math.min(x, width));
}

/**
 * Clamp Y coordinate based on which corner it is
 * @param {number} y - Y coordinate
 * @param {number} cornerIndex - 0=TL, 1=TR, 2=BR, 3=BL
 * @param {number} height - Element height
 * @param {number} maxOffset - Maximum offset value
 * @returns {number} - Clamped Y coordinate
 */
function clampCornerY(y, cornerIndex, height, maxOffset) {
  // Top corners (0, 1) should stay near top edge
  if (cornerIndex === 0 || cornerIndex === 1) {
    return Math.max(0, Math.min(y, maxOffset * 2));
  }
  // Bottom corners (2, 3) should stay near bottom edge
  return Math.max(height - maxOffset * 2, Math.min(y, height));
}
