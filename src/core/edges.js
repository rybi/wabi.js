import { randomInRange } from "../utils/random.js";

/**
 * Insert additional points along an edge between two corners
 * @param {object} start - Start point {x, y}
 * @param {object} end - End point {x, y}
 * @param {object} edgeOptions - Edge options
 * @param {number} edgeOptions.points - Number of points to insert
 * @param {number} edgeOptions.deviation - Max perpendicular deviation
 * @param {string} edgeOptions.distribution - 'random' | 'even' | 'weighted-center'
 * @param {function} rng - Random number generator
 * @returns {Array<{x: number, y: number}>} - Array of edge points (not including start/end)
 */
export function generateEdgePoints(start, end, edgeOptions, rng) {
  const { points = 0, deviation = 0, distribution = "random" } = edgeOptions;

  if (points <= 0 || deviation === 0) {
    return [];
  }

  // Get positions along the edge (0-1 range)
  const positions = getPositions(points, distribution, rng);

  // Calculate edge vector and perpendicular
  const edgeVector = {
    x: end.x - start.x,
    y: end.y - start.y,
  };

  // Length of edge
  const edgeLength = Math.sqrt(
    edgeVector.x * edgeVector.x + edgeVector.y * edgeVector.y
  );

  // Normalized perpendicular vector (rotated 90 degrees)
  const perpendicular = {
    x: -edgeVector.y / edgeLength,
    y: edgeVector.x / edgeLength,
  };

  // Generate points
  return positions.map((t) => {
    // Point on the line at position t
    const pointOnLine = {
      x: start.x + t * edgeVector.x,
      y: start.y + t * edgeVector.y,
    };

    // Random perpendicular offset
    const offset = randomInRange(rng, -deviation, deviation);

    return {
      x: pointOnLine.x + offset * perpendicular.x,
      y: pointOnLine.y + offset * perpendicular.y,
    };
  });
}

/**
 * Get position values (0-1) for edge points based on distribution
 * @param {number} count - Number of positions
 * @param {string} distribution - Distribution type
 * @param {function} rng - Random number generator
 * @returns {number[]} - Array of positions (sorted)
 */
function getPositions(count, distribution, rng) {
  let positions;

  switch (distribution) {
    case "even":
      // Evenly spaced positions
      positions = [];
      for (let i = 1; i <= count; i++) {
        positions.push(i / (count + 1));
      }
      break;

    case "weighted-center":
      // More points toward center using simple approximation
      positions = [];
      for (let i = 0; i < count; i++) {
        // Box-Muller-like approach, clamped to 0.1-0.9
        const u = rng();
        const centered = 0.5 + (u - 0.5) * 0.6; // Bias toward center
        positions.push(Math.max(0.1, Math.min(0.9, centered)));
      }
      positions.sort((a, b) => a - b);
      break;

    case "random":
    default:
      // Random positions
      positions = [];
      for (let i = 0; i < count; i++) {
        positions.push(0.1 + rng() * 0.8); // Keep away from corners
      }
      positions.sort((a, b) => a - b);
      break;
  }

  return positions;
}

/**
 * Insert edge points into a polygon between all edges
 * @param {Array<{x: number, y: number}>} corners - Array of corner points
 * @param {object} edgeOptions - Edge options
 * @param {function} rng - Random number generator
 * @returns {Array<{x: number, y: number}>} - Complete polygon with edge points
 */
export function insertEdgePoints(corners, edgeOptions, rng) {
  const { points = 0 } = edgeOptions;

  if (points <= 0) {
    return corners;
  }

  const polygon = [];

  for (let i = 0; i < corners.length; i++) {
    const start = corners[i];
    const end = corners[(i + 1) % corners.length];

    // Add the corner
    polygon.push(start);

    // Generate and add edge points
    const edgePoints = generateEdgePoints(start, end, edgeOptions, rng);
    polygon.push(...edgePoints);
  }

  return polygon;
}
