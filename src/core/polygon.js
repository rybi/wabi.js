import { generateCorners } from "./corners.js";
import { insertEdgePoints } from "./edges.js";
import { getRNG } from "../utils/random.js";

/**
 * Generate a complete irregular polygon for an element
 * @param {number} width - Element width (100 for percentage mode)
 * @param {number} height - Element height (100 for percentage mode)
 * @param {object} options - Generation options
 * @param {object} options.corners - Corner displacement options
 * @param {object} options.edges - Edge point options
 * @param {number|null} options.seed - Random seed (null for Math.random)
 * @returns {Array<{x: number, y: number}>} - Array of polygon points
 */
export function generatePolygon(width, height, options) {
  const {
    corners: cornerOptions = { x: 0, y: 0 },
    edges: edgeOptions = { points: 0, deviation: 0 },
    seed = null,
  } = options;

  // Get random number generator
  const rng = getRNG(seed);

  // Generate displaced corners
  const corners = generateCorners(width, height, cornerOptions, rng);

  // Insert edge points
  const polygon = insertEdgePoints(corners, edgeOptions, rng);

  return polygon;
}

/**
 * Default options for polygon generation
 */
export const defaultOptions = {
  corners: {
    x: 5,
    y: 4,
    independent: true,
  },
  edges: {
    points: 0,
    deviation: 3,
    distribution: "random",
  },
  shadow: null, // disabled by default; set to object to enable
  seed: null,
  units: "%",
  preserveOnResize: true,
};

/**
 * Merge user options with defaults
 * @param {object} userOptions - User provided options
 * @returns {object} - Merged options
 */
export function mergeOptions(userOptions) {
  // Handle shadow: false explicitly disables, null uses default (disabled), object enables
  let shadow = defaultOptions.shadow;
  if (userOptions.shadow === false) {
    shadow = false;
  } else if (userOptions.shadow && typeof userOptions.shadow === "object") {
    shadow = userOptions.shadow;
  }

  return {
    corners: {
      ...defaultOptions.corners,
      ...(userOptions.corners || {}),
    },
    edges: {
      ...defaultOptions.edges,
      ...(userOptions.edges || {}),
    },
    shadow,
    seed: userOptions.seed !== undefined ? userOptions.seed : defaultOptions.seed,
    units: userOptions.units || defaultOptions.units,
    preserveOnResize:
      userOptions.preserveOnResize !== undefined
        ? userOptions.preserveOnResize
        : defaultOptions.preserveOnResize,
  };
}

/**
 * Parse shorthand arguments into options object
 * @param {Array} args - Arguments array: [selector, cornerX, cornerY, edgePoints?]
 * @returns {object} - Parsed options
 */
export function parseShorthand(args) {
  if (args.length === 2 && typeof args[1] === "number") {
    // wabi(selector, cornerX) - just X displacement
    return { corners: { x: args[1], y: args[1] } };
  }

  if (args.length >= 3 && typeof args[1] === "number" && typeof args[2] === "number") {
    const options = { corners: { x: args[1], y: args[2] } };

    if (args.length >= 4 && typeof args[3] === "number") {
      // wabi(selector, cornerX, cornerY, edgePoints)
      options.edges = { points: args[3] };
    }

    return options;
  }

  // Not shorthand, return empty
  return {};
}
