/**
 * Create a seeded random number generator using mulberry32 algorithm
 * @param {number} seed - The seed value
 * @returns {function} - A function that returns random numbers between 0 and 1
 */
function createRNG(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Get a random number in a range
 * @param {function} rng - Random number generator function
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} - Random number between min and max
 */
function randomInRange(rng, min, max) {
  return min + rng() * (max - min);
}

/**
 * Create a default RNG using Math.random or a seeded one
 * @param {number|null} seed - Optional seed value
 * @returns {function} - A random number generator function
 */
function getRNG(seed) {
  if (seed === null || seed === undefined) {
    return Math.random;
  }
  return createRNG(seed);
}

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
function generateCorners(width, height, cornerOptions, rng) {
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

/**
 * Insert additional points along an edge between two corners
 * @param {object} start - Start point {x, y}
 * @param {object} end - End point {x, y}
 * @param {object} edgeOptions - Edge options
 * @param {number} edgeOptions.points - Number of points to insert
 * @param {number} edgeOptions.edgeWobble - Max perpendicular deviation
 * @param {string} edgeOptions.distribution - 'random' | 'even' | 'weighted-center'
 * @param {function} rng - Random number generator
 * @returns {Array<{x: number, y: number}>} - Array of edge points (not including start/end)
 */
function generateEdgePoints(start, end, edgeOptions, rng) {
  const { points = 0, edgeWobble = 0, distribution = "random" } = edgeOptions;

  if (points <= 0 || edgeWobble === 0) {
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
    const offset = randomInRange(rng, -edgeWobble, edgeWobble);

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
function insertEdgePoints(corners, edgeOptions, rng) {
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

/**
 * Select which corners to cut randomly
 * @param {number} count - Number of corners to cut (0-4)
 * @param {function} rng - Random number generator
 * @returns {Set<number>} - Set of corner indices to cut
 */
function selectCornersToCut(count, rng) {
  if (count <= 0) return new Set();
  if (count >= 4) return new Set([0, 1, 2, 3]);

  const available = [0, 1, 2, 3];
  const selected = new Set();

  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(rng() * available.length);
    selected.add(available[randomIndex]);
    available.splice(randomIndex, 1);
  }

  return selected;
}

/**
 * Generate a complete irregular polygon for an element
 * @param {number} width - Element width (100 for percentage mode)
 * @param {number} height - Element height (100 for percentage mode)
 * @param {object} options - Generation options
 * @param {object} options.corners - Corner displacement options
 * @param {object} options.edges - Edge point options
 * @param {number} options.cutCorners - Number of corners to cut (0-4)
 * @param {number|null} options.seed - Random seed (null for Math.random)
 * @returns {Array<{x: number, y: number}>} - Array of polygon points
 */
function generatePolygon(width, height, options) {
  const {
    corners: cornerOptions = { x: 0, y: 0 },
    edges: edgeOptions = { points: 0, edgeWobble: 0 },
    cutCorners = 0,
    cornerChamfer = 1,
    seed = null,
  } = options;

  // Get random number generator
  const rng = getRNG(seed);

  // Generate displaced corners
  const corners = generateCorners(width, height, cornerOptions, rng);

  // FIRST: Insert edge points between all 4 corners
  let polygon = insertEdgePoints(corners, edgeOptions, rng);

  // THEN: Handle cut corners based on chamfer value
  if (cutCorners > 0) {
    const cornersToCut = selectCornersToCut(cutCorners, rng);
    const pointsPerEdge = edgeOptions.points || 0;
    const stride = pointsPerEdge + 1; // distance between corner indices in polygon
    const chamfer = cornerChamfer ?? 1;

    if (chamfer >= 1) {
      // Full cut - remove corner points entirely
      polygon = polygon.filter((_, index) => {
        const cornerIndex = Math.floor(index / stride);
        const isCornerPoint = index % stride === 0;
        return !(isCornerPoint && cornersToCut.has(cornerIndex));
      });
    } else if (chamfer > 0) {
      // Partial chamfer - move corners toward cut line
      polygon = polygon.map((point, index) => {
        const cornerIndex = Math.floor(index / stride);
        const isCornerPoint = index % stride === 0;

        if (isCornerPoint && cornersToCut.has(cornerIndex)) {
          // Find adjacent points (previous and next in polygon)
          const prevIndex = (index - 1 + polygon.length) % polygon.length;
          const nextIndex = (index + 1) % polygon.length;
          const prevPoint = polygon[prevIndex];
          const nextPoint = polygon[nextIndex];

          // Calculate midpoint of deletion line
          const midpoint = {
            x: (prevPoint.x + nextPoint.x) / 2,
            y: (prevPoint.y + nextPoint.y) / 2,
          };

          // Move corner toward midpoint by chamfer amount
          return {
            x: point.x + (midpoint.x - point.x) * chamfer,
            y: point.y + (midpoint.y - point.y) * chamfer,
          };
        }
        return point;
      });
    }
    // chamfer === 0: no change to polygon
  }

  return polygon;
}

/**
 * Default options for polygon generation
 */
const defaultOptions = {
  corners: {
    x: 5,
    y: 4,
    independent: true,
  },
  edges: {
    points: 0,
    edgeWobble: 3,
    distribution: "random",
  },
  cutCorners: 0, // number of corners to cut (0-4)
  cornerChamfer: 1, // 0-1, how far cut corners move inward (1 = full cut)
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
function mergeOptions(userOptions) {
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
    cutCorners:
      userOptions.cutCorners !== undefined
        ? userOptions.cutCorners
        : defaultOptions.cutCorners,
    cornerChamfer:
      userOptions.cornerChamfer !== undefined
        ? userOptions.cornerChamfer
        : defaultOptions.cornerChamfer,
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
function parseShorthand(args) {
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

/**
 * Normalize various selector inputs into an array of DOM elements
 * @param {string|Element|NodeList|HTMLCollection|Array} selector - The selector input
 * @returns {Element[]} - Array of DOM elements
 */
function normalizeSelector(selector) {
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

/**
 * Debounce a function
 * @param {function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {function} - Debounced function
 */
function debounce(fn, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

// Singleton ResizeObserver
let sharedResizeObserver = null;
const resizeCallbacks = new WeakMap(); // Map<Element, Callback>

// Singleton window resize handler (fallback)
let sharedWindowHandler = null;
const windowResizeCallbacks = new Set(); // Set<Callback>

function handleResizeEntries(entries) {
  for (const entry of entries) {
    const callback = resizeCallbacks.get(entry.target);
    if (callback) {
      callback(entry);
    }
  }
}

function handleWindowResize() {
  windowResizeCallbacks.forEach((callback) => callback());
}

/**
 * Set up a resize observer for an element
 * @param {Element} element - Element to observe
 * @param {function} callback - Callback to run on resize
 * @param {object} options - Options object
 * @param {boolean} options.bypassDebounceOnce - Bypass debounce for the first resize event
 * @returns {function} - Cleanup function to stop observing
 */
function setupResizeObserver(element, callback, options = {}) {
  const { bypassDebounceOnce = false } = options;

  // Modern approach: ResizeObserver
  if (typeof ResizeObserver !== "undefined") {
    if (!sharedResizeObserver) {
      sharedResizeObserver = new ResizeObserver(debounce(handleResizeEntries, 20));
    }

    // Debounce the individual callback too to prevent thrashing
    const debouncedCallback = debounce(callback, 100);

    // For elements starting with zero dimensions, bypass debounce on first resize
    let hasCalledOnce = false;
    const conditionalCallback = bypassDebounceOnce
      ? (entry) => {
          if (!hasCalledOnce) {
            hasCalledOnce = true;
            callback(entry); // Call immediately on first resize
          } else {
            debouncedCallback(entry); // Use debounced version afterward
          }
        }
      : debouncedCallback;

    resizeCallbacks.set(element, conditionalCallback);
    sharedResizeObserver.observe(element);

    return () => {
      sharedResizeObserver.unobserve(element);
      resizeCallbacks.delete(element);
    };
  }

  // Fallback: window resize event
  if (!sharedWindowHandler) {
    sharedWindowHandler = debounce(handleWindowResize, 100);
    window.addEventListener("resize", sharedWindowHandler);
  }

  const debouncedCallback = debounce(callback, 100);

  // For elements starting with zero dimensions, bypass debounce on first resize
  const conditionalFallbackCallback = bypassDebounceOnce
    ? (() => {
        let hasCalledOnce = false;
        return () => {
          if (!hasCalledOnce) {
            hasCalledOnce = true;
            callback();
          } else {
            debouncedCallback();
          }
        };
      })()
    : debouncedCallback;

  windowResizeCallbacks.add(conditionalFallbackCallback);

  return () => {
    windowResizeCallbacks.delete(conditionalFallbackCallback);
    // Optional: remove window listener if set is empty, but maybe not strictly necessary for this scope
    if (windowResizeCallbacks.size === 0 && sharedWindowHandler) {
      window.removeEventListener("resize", sharedWindowHandler);
      sharedWindowHandler = null;
    }
  };
}

/**
 * Convert a value to pixels based on element dimension
 * @param {number} value - The value to convert
 * @param {number} dimension - The element dimension (width or height)
 * @param {string} unit - The unit type ('px' or '%')
 * @returns {number} - Value in pixels
 */

/**
 * Format a point for clip-path string
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {string} unit - Unit type ('px' or '%')
 * @returns {string} - Formatted point string
 */
function formatPoint(x, y, unit) {
  if (unit === "px") {
    return `${x.toFixed(2)}px ${y.toFixed(2)}px`;
  }
  return `${x.toFixed(2)}% ${y.toFixed(2)}%`;
}

/**
 * Generate a CSS clip-path polygon string from points
 * @param {Array<{x: number, y: number}>} points - Array of polygon points
 * @param {string} unit - Unit type ('px' or '%')
 * @returns {string} - CSS clip-path value
 */
function generateClipPath(points, unit = "%") {
    const pointStrings = points.map((p) => formatPoint(p.x, p.y, unit));
    return `polygon(${pointStrings.join(", ")})`;
}

/**
 * Default shadow options (used when shadow is enabled without specifics)
 */
const defaultShadowOptions = {
    x: 0,
    y: 4,
    blur: 8,
    color: "rgba(0,0,0,0.15)",
};

/**
 * Generate a CSS drop-shadow filter string
 * @param {object|false|null} shadowOptions - Shadow configuration
 * @returns {string|null} - CSS filter string or null if disabled
 */
function generateDropShadow(shadowOptions) {
    // Explicitly disabled or not set
    if (!shadowOptions || shadowOptions === false) {
        return null;
    }

    // Merge with defaults
    const {
        x = defaultShadowOptions.x,
        y = defaultShadowOptions.y,
        blur = defaultShadowOptions.blur,
        color = defaultShadowOptions.color,
    } = shadowOptions;

    return `drop-shadow(${x}px ${y}px ${blur}px ${color})`;
}

/**
 * Manages the wrapper element for applying shadows without clipping.
 */
class ShadowManager {
    constructor() {
        this.wrappers = new WeakMap();
    }

    /**
     * Wrap element with a container for shadow effect
     * Shadow must be on wrapper so it doesn't get clipped by clip-path
     * @param {Element} element - Element to wrap
     * @param {string} dropShadow - CSS drop-shadow filter value
     * @param {object} options - Options
     * @returns {Element} - The wrapper element
     */
    wrap(element, dropShadow, options) {
        const computed = window.getComputedStyle(element);

        // Shadow wrapping doesn't work with fixed/absolute positioning
        // due to conflicting position constraints
        if (computed.position === 'fixed' || computed.position === 'absolute') {
            console.warn('wabi.js: Shadow not supported for position:fixed/absolute elements', element);
            return null;
        }

        let wrapper = this.wrappers.get(element);

        // Create wrapper if doesn't exist
        if (!wrapper) {
            wrapper = document.createElement("div");
            wrapper.className = "wabi-shadow-wrapper";
            if (options.wrapperClass) {
                wrapper.classList.add(options.wrapperClass);
            }

            // Insert wrapper and move element into it
            if (element.parentNode) {
                element.parentNode.insertBefore(wrapper, element);
            }
            wrapper.appendChild(element);
            this.wrappers.set(element, wrapper);
        }

        // Apply shadow to wrapper
        wrapper.style.filter = dropShadow;

        this.syncStyles(element, wrapper);

        return wrapper;
    }

    /**
     * Sync layout styles from element to wrapper
     * @param {Element} element
     * @param {Element} wrapper
     */
    syncStyles(element, wrapper) {
        const computed = window.getComputedStyle(element);
        const layoutProps = [
            "display", "position", "top", "right", "bottom", "left", "float", "clear", "zIndex",
            "flex", "flexGrow", "flexShrink", "flexBasis", "alignSelf", "justifySelf",
            "gridArea", "gridColumn", "gridRow", "gridColumnStart", "gridColumnEnd", "gridRowStart", "gridRowEnd",
            "order",
            "marginTop", "marginRight", "marginBottom", "marginLeft",
        ];

        layoutProps.forEach(prop => {
            wrapper.style[prop] = computed[prop];
        });

        // Reset context on element so it behaves correctly inside wrapper
        element.style.margin = "0";

        // Special handling for position
        if (computed.position === "absolute" || computed.position === "fixed") {
            element.style.position = "static";
            element.style.top = "auto";
            element.style.right = "auto";
            element.style.bottom = "auto";
            element.style.left = "auto";
        }

        // Copy box-sizing to ensure wrapper matches element sizing logic if dimensions are copied
        // (though we generally let content dictate wrapper size unless we implement more complex sync)
    }

    /**
     * Unwrap element from shadow wrapper
     * @param {Element} element - Element to unwrap
     */
    unwrap(element) {
        const wrapper = this.wrappers.get(element);
        if (!wrapper) return;

        // Reset element styles that were modified
        element.style.margin = "";
        element.style.position = "";
        element.style.top = "";
        element.style.right = "";
        element.style.bottom = "";
        element.style.left = "";

        // Move element back to original position (before wrapper)
        if (wrapper.parentNode) {
            wrapper.parentNode.insertBefore(element, wrapper);
        }
        // Remove the empty wrapper
        wrapper.remove();
        this.wrappers.delete(element);
    }
}

// Singleton instance
const shadowManager = new ShadowManager();

/**
 * Global animation loop using requestAnimationFrame
 */
class Loop {
    constructor() {
        this.items = new Set();
        this.isRunning = false;
        this.frameId = null;
        this.lastTime = 0;
    }

    /**
     * Add item to animation loop
     * @param {object} item - Object with update(deltaTime) method
     */
    add(item) {
        this.items.add(item);
        if (!this.isRunning && this.items.size > 0) {
            this.start();
        }
    }

    /**
     * Remove item from animation loop
     * @param {object} item - Item to remove
     */
    remove(item) {
        this.items.delete(item);
        if (this.isRunning && this.items.size === 0) {
            this.stop();
        }
    }

    /**
     * Start the loop
     */
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        this.frameId = requestAnimationFrame(this.tick.bind(this));
    }

    /**
     * Stop the loop
     */
    stop() {
        this.isRunning = false;
        if (this.frameId) {
            cancelAnimationFrame(this.frameId);
            this.frameId = null;
        }
    }

    /**
     * Animation tick
     * @param {number} timestamp 
     */
    tick(timestamp) {
        if (!this.isRunning) return;

        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.items.forEach(item => {
            if (item.update) {
                item.update(deltaTime);
            }
        });

        this.frameId = requestAnimationFrame(this.tick.bind(this));
    }
}

// Singleton instance
const loop = new Loop();

const WABI_INSTANCE = Symbol("wabi.instance");

class WabiElement {
    constructor(element, options) {
        this.element = element;
        this.options = options;
        this.originalStart = {
            clipPath: element.style.clipPath,
            filter: element.style.filter,
            transition: element.style.transition
        };
        this.cleanups = [];
        this.isFirstRender = true;
        this.lastAspectRatio = 0;

        // Warn if overwriting
        if (this.originalStart.clipPath && this.originalStart.clipPath !== "none") {
            console.warn("wabi.js: Existing clip-path will be overwritten.", element);
        }

        this.init();
    }

    init() {
        this.resizeCleanup = setupResizeObserver(this.element, () => this.handleResize(), {
            bypassDebounceOnce: this.isFirstRender
        });
        this.cleanups.push(this.resizeCleanup);

        // Initial render check
        const w = this.element.offsetWidth;
        const h = this.element.offsetHeight;
        if (w > 1 && h > 1) {
            this.update();
            this.isFirstRender = false;
        }

        // Apply shadow
        this.updateShadow();
    }

    handleResize() {
        if (this.options.units === "%") {
            const currentAspectRatio = this.element.offsetWidth / this.element.offsetHeight;
            // Logic to avoid unnecessary updates if aspect ratio hasn't changed enough
            if (!isFinite(this.lastAspectRatio)) this.lastAspectRatio = 0;

            if (this.lastAspectRatio === 0 && isFinite(currentAspectRatio) && currentAspectRatio > 0) {
                this.lastAspectRatio = currentAspectRatio;
                this.isFirstRender = false;
                this.update();
                return;
            }

            if (Math.abs(currentAspectRatio - this.lastAspectRatio) / this.lastAspectRatio > 0.01) {
                this.lastAspectRatio = currentAspectRatio;
                this.update();
            }
        } else if (this.options.units === "px") {
            this.update();
        }
    }

    updateShadow() {
        const dropShadow = generateDropShadow(this.options.shadow);
        if (dropShadow) {
            shadowManager.wrap(this.element, dropShadow, this.options);
        } else {
            shadowManager.unwrap(this.element);
        }
    }

    update() {
        let polygon;

        if (this.options.units === "%") {
            const w = this.element.offsetWidth;
            const h = this.element.offsetHeight;
            const base = Math.sqrt(w * h);
            const genWidth = (w / base) * 100;
            const genHeight = (h / base) * 100;

            polygon = generatePolygon(genWidth, genHeight, this.options);

            // Normalize back to 0-100%
            polygon = polygon.map(p => ({
                x: (p.x / genWidth) * 100,
                y: (p.y / genHeight) * 100
            }));
        } else {
            polygon = generatePolygon(this.element.offsetWidth, this.element.offsetHeight, this.options);
        }

        const clipPath = generateClipPath(polygon, this.options.units);

        // Disable transition for instant snap
        const prevTransition = this.element.style.transition;
        this.element.style.transition = "none";
        this.element.style.clipPath = clipPath;
        this.element.offsetHeight; // Force reflow
        this.element.style.transition = prevTransition;
    }

    setOptions(newOptions) {
        this.options = mergeOptions({ ...this.options, ...newOptions });
        // Special merge logic for sub-objects already handled in mergeOptions? 
        // Actually mergeOptions in polygon.js does a shallow merge of top keys but deep merge of corners/edges?
        // Let's verify mergeOptions logic. It does minimal merging.
        // Ideally we should do a proper merge here if needed, but for now relying on replacement or mergeOptions is fine.
        // The previous implementation did a manual deep merge. I should probably replicate that.

        this.update();
        this.updateShadow();
    }

    restore() {
        shadowManager.unwrap(this.element);
        this.element.style.clipPath = this.originalStart.clipPath;

        this.cleanups.forEach(fn => fn());
        this.cleanups = [];
    }
}

class Wabi {
    constructor(selector, optionsOrCornerX, cornerY, edgePoints) {
        this.elements = normalizeSelector(selector);
        this.wabiElements = [];

        if (this.elements.length === 0) {
            return;
        }

        let options;
        if (typeof optionsOrCornerX === "object" && optionsOrCornerX !== null) {
            options = mergeOptions(optionsOrCornerX);
        } else {
            const shorthand = parseShorthand([selector, optionsOrCornerX, cornerY, edgePoints]);
            options = mergeOptions(shorthand);
        }

        this.wabiElements = this.elements.map(el => {
            // Check for existing instance and restore it? 
            // Or just overwrite? Current logic overwrite but warns.
            // We'll create a new helper.
            if (el[WABI_INSTANCE]) {
                el[WABI_INSTANCE].restore();
            }

            const wabiEl = new WabiElement(el, options);
            el[WABI_INSTANCE] = wabiEl;
            return wabiEl;
        });

        this.animationItem = null;
    }

    update() {
        this.wabiElements.forEach(el => el.update());
    }

    restore() {
        this.stop(); // Stop animation if running
        this.wabiElements.forEach(el => {
            el.restore();
            delete el.element[WABI_INSTANCE];
        });
        this.wabiElements = [];
    }

    setOptions(newOptions) {
        this.wabiElements.forEach(el => {
            // Manual deep merge replication from apply.js to ensure safety
            const current = el.options;
            const mergedBase = {
                ...current,
                ...newOptions,
                corners: { ...current.corners, ...(newOptions.corners || {}) },
                edges: { ...current.edges, ...(newOptions.edges || {}) },
                cutCorners: newOptions.cutCorners ?? current.cutCorners,
                cornerChamfer: newOptions.cornerChamfer ?? current.cornerChamfer,
            };

            if (newOptions.shadow === false) {
                mergedBase.shadow = false;
            } else if (newOptions.shadow && typeof newOptions.shadow === "object") {
                mergedBase.shadow = { ...(current.shadow || {}), ...newOptions.shadow };
            }

            el.setOptions(mergeOptions(mergedBase));
        });
    }

    animate(animateOptions = {}) {
        const interval = animateOptions.interval ?? 100;

        if (this.animationItem) {
            loop.remove(this.animationItem);
        }

        this.animationItem = {
            elapsed: 0,
            interval: interval,
            update: (deltaTime) => {
                this.animationItem.elapsed += deltaTime;
                if (this.animationItem.elapsed >= this.animationItem.interval) {
                    this.update();
                    this.animationItem.elapsed = 0;
                }
            }
        };

        loop.add(this.animationItem);
    }

    stop() {
        if (this.animationItem) {
            loop.remove(this.animationItem);
            this.animationItem = null;
        }
    }

    get isAnimating() {
        return !!this.animationItem;
    }

    // Static helper to match the API
    static apply(selector, options, ...args) {
        const instance = new Wabi(selector, options, ...args);

        // Auto-start animation if requested
        if (instance.wabiElements.length > 0 && typeof options === 'object' && options.animate) {
            instance.animate(typeof options.animate === 'object' ? options.animate : {});
        }

        return instance;
    }
}

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

export { wabi as default };
