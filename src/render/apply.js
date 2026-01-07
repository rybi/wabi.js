import { generatePolygon, mergeOptions, parseShorthand } from "../core/polygon.js";
import { generateClipPath } from "./clipPath.js";
import { generateDropShadow } from "./shadow.js";
import { normalizeSelector } from "../utils/selector.js";
import { setupResizeObserver } from "../utils/resize.js";

// Store original clip-path values for restore
const originalClipPaths = new WeakMap();

// Store original filter values for restore
const originalFilters = new WeakMap();

// Store resize cleanup functions
const resizeCleanups = new WeakMap();

// Store shadow wrapper elements
const shadowWrappers = new WeakMap();

// Symbol-based properties to avoid collision with other libraries
const WABI_REGENERATE = Symbol("wabi.regenerate");
const WABI_OPTIONS = Symbol("wabi.options");

/**
 * Wrap element with a container for shadow effect
 * Shadow must be on wrapper so it doesn't get clipped by clip-path
 * @param {Element} element - Element to wrap
 * @param {string} dropShadow - CSS drop-shadow filter value
 * @returns {Element} - The wrapper element
 */

function wrapElementForShadow(element, dropShadow, options) {
  // Check if already wrapped
  let wrapper = shadowWrappers.get(element);

  // Create wrapper if doesn't exist
  if (!wrapper) {
    wrapper = document.createElement("div");
    wrapper.className = "wabi-shadow-wrapper";
    if (options.wrapperClass) {
      wrapper.classList.add(options.wrapperClass);
    }

    // Insert wrapper and move element into it
    element.parentNode.insertBefore(wrapper, element);
    wrapper.appendChild(element);
    shadowWrappers.set(element, wrapper);
  }

  // Apply shadow to wrapper
  wrapper.style.filter = dropShadow;

  // Copy layout styles from element to wrapper
  const computed = window.getComputedStyle(element);
  const layoutProps = [
    "display", "position", "top", "right", "bottom", "left", "float", "clear", "zIndex",
    "flex", "flexGrow", "flexShrink", "flexBasis", "alignSelf", "justifySelf",
    "gridArea", "gridColumn", "gridRow", "gridColumnStart", "gridColumnEnd", "gridRowStart", "gridRowEnd",
    "order",
    "marginTop", "marginRight", "marginBottom", "marginLeft" // individual margins to be safe
  ];

  layoutProps.forEach(prop => {
    wrapper.style[prop] = computed[prop];
  });

  // Reset context on element so it behaves correctly inside wrapper
  element.style.margin = "0";
  // We keep width/height on the element, wrapper should fit content or copy?
  // If we copy display, wrapper behaves like element.

  // Special handling for position
  if (computed.position === "absolute" || computed.position === "fixed") {
    element.style.position = "static";
    // We already moved top/left/etc to wrapper
    element.style.top = "auto";
    element.style.right = "auto";
    element.style.bottom = "auto";
    element.style.left = "auto";
  }

  return wrapper;
}

/**
 * Unwrap element from shadow wrapper
 * @param {Element} element - Element to unwrap
 */

function unwrapElement(element) {
  const wrapper = shadowWrappers.get(element);
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
  shadowWrappers.delete(element);
}

/**
 * Apply wabi effect to elements
 * @param {string|Element|NodeList} selector - Target elements
 * @param {object|number} optionsOrCornerX - Options object or corner X offset
 * @param {number} [cornerY] - Corner Y offset (shorthand mode)
 * @param {number} [edgePoints] - Number of edge points (shorthand mode)
 * @returns {object} - Control object with restore, update, setOptions
 */
export function apply(selector, optionsOrCornerX, cornerY, edgePoints) {
  const elements = normalizeSelector(selector);

  if (elements.length === 0) {
    return createResult([]);
  }

  // Parse options - handle both object and shorthand forms
  let options;
  if (typeof optionsOrCornerX === "object" && optionsOrCornerX !== null) {
    options = mergeOptions(optionsOrCornerX);
  } else {
    const shorthand = parseShorthand([selector, optionsOrCornerX, cornerY, edgePoints]);
    options = mergeOptions(shorthand);
  }

  // Apply to each element
  elements.forEach((element) => {
    applyToElement(element, options);
  });

  return createResult(elements, options);
}

/**
 * Apply wabi effect to a single element
 * @param {Element} element - Target element
 * @param {object} options - Merged options
 */
function applyToElement(element, options) {
  // Store original clip-path if not already stored
  if (!originalClipPaths.has(element)) {
    const existingClipPath = element.style.clipPath;
    // Warn if overwriting an existing clip-path
    if (existingClipPath && existingClipPath !== "none" && existingClipPath !== "") {
      console.warn("wabi.js: Existing clip-path will be overwritten. Call restore() to recover.", element);
    }
    originalClipPaths.set(element, existingClipPath || "");
  }

  // Store original filter if not already stored
  if (!originalFilters.has(element)) {
    originalFilters.set(element, element.style.filter || "");
  }

  // Clean up any existing resize observer
  const existingCleanup = resizeCleanups.get(element);
  if (existingCleanup) {
    existingCleanup();
  }

  // Generate and apply clip-path
  const regenerate = () => {
    let width, height, polygon;
    if (options.units === "%") {
      // Use area-equivalent square as reference for uniform visual effect
      // across different aspect ratios: offset means % of sqrt(w*h)
      const w = element.offsetWidth;
      const h = element.offsetHeight;
      const base = Math.sqrt(w * h);
      const genWidth = (w / base) * 100;
      const genHeight = (h / base) * 100;

      // Generate polygon in stretched space
      polygon = generatePolygon(genWidth, genHeight, options);

      // Convert back to CSS percentage space (0-100)
      polygon = polygon.map(p => ({
        x: (p.x / genWidth) * 100,
        y: (p.y / genHeight) * 100
      }));
    } else {
      width = element.offsetWidth;
      height = element.offsetHeight;
      polygon = generatePolygon(width, height, options);
    }

    const clipPath = generateClipPath(polygon, options.units);

    // Temporarily disable transitions to prevent animation of clip-path change
    const originalTransition = element.style.transition;
    element.style.transition = "none";
    element.style.clipPath = clipPath;
    // Force reflow to apply the change before re-enabling transitions
    element.offsetHeight; // eslint-disable-line no-unused-expressions
    element.style.transition = originalTransition;
  };

  regenerate();

  // Apply shadow via wrapper (so it doesn't get clipped by clip-path)
  const dropShadow = generateDropShadow(options.shadow);
  if (dropShadow) {
    wrapElementForShadow(element, dropShadow, options);
  } else {
    // Shadow disabled - unwrap if previously wrapped
    unwrapElement(element);
  }

  // Set up resize observer if needed
  if (options.preserveOnResize) {
    if (options.units === "px") {
      // Standard resize regeneration for pixel mode
      const cleanup = setupResizeObserver(element, regenerate);
      resizeCleanups.set(element, cleanup);
    } else if (options.units === "%") {
      // Aspect ratio change detection for percentage mode
      let lastAspectRatio = element.offsetWidth / element.offsetHeight;

      const checkAspectRatio = () => {
        const currentAspectRatio = element.offsetWidth / element.offsetHeight;
        // Only regenerate if aspect ratio changed significantly (>1% change)
        if (Math.abs(currentAspectRatio - lastAspectRatio) / lastAspectRatio > 0.01) {
          lastAspectRatio = currentAspectRatio;
          regenerate();
        }
      };

      const cleanup = setupResizeObserver(element, checkAspectRatio);
      resizeCleanups.set(element, cleanup);
    }
  }

  // Store regenerate function for update()
  element[WABI_REGENERATE] = regenerate;
  element[WABI_OPTIONS] = options;
}

/**
 * Restore original clip-path for elements
 * @param {Element[]} elements - Elements to restore
 */
function restoreElements(elements) {
  elements.forEach((element) => {
    // Unwrap from shadow wrapper first (before restoring other styles)
    unwrapElement(element);

    // Restore original clip-path
    const originalClipPath = originalClipPaths.get(element);
    if (originalClipPath !== undefined) {
      element.style.clipPath = originalClipPath;
      originalClipPaths.delete(element);
    }

    // Restore original filter
    const originalFilter = originalFilters.get(element);
    if (originalFilter !== undefined) {
      element.style.filter = originalFilter;
      originalFilters.delete(element);
    }

    // Clean up resize observer
    const cleanup = resizeCleanups.get(element);
    if (cleanup) {
      cleanup();
      resizeCleanups.delete(element);
    }

    // Clean up stored functions
    delete element[WABI_REGENERATE];
    delete element[WABI_OPTIONS];
  });
}

/**
 * Update elements with new random values
 * @param {Element[]} elements - Elements to update
 */
function updateElements(elements) {
  elements.forEach((element) => {
    if (element[WABI_REGENERATE]) {
      element[WABI_REGENERATE]();
    }
  });
}

/**
 * Update options and re-render
 * @param {Element[]} elements - Elements to update
 * @param {object} newOptions - New options (partial)
 */
function setElementOptions(elements, newOptions) {
  elements.forEach((element) => {
    if (element[WABI_OPTIONS]) {
      // Build merged options manually to handle shadow correctly
      const mergedBase = {
        ...element[WABI_OPTIONS],
        ...newOptions,
        corners: {
          ...element[WABI_OPTIONS].corners,
          ...(newOptions.corners || {}),
        },
        edges: {
          ...element[WABI_OPTIONS].edges,
          ...(newOptions.edges || {}),
        },
        cutCorners:
          newOptions.cutCorners !== undefined
            ? newOptions.cutCorners
            : element[WABI_OPTIONS].cutCorners,
        cornerInset:
          newOptions.cornerInset !== undefined
            ? newOptions.cornerInset
            : element[WABI_OPTIONS].cornerInset,
      };

      // Handle shadow merging
      if (newOptions.shadow === false) {
        mergedBase.shadow = false;
      } else if (newOptions.shadow && typeof newOptions.shadow === "object") {
        mergedBase.shadow = {
          ...(element[WABI_OPTIONS].shadow || {}),
          ...newOptions.shadow,
        };
      }

      const mergedOptions = mergeOptions(mergedBase);
      applyToElement(element, mergedOptions);
    }
  });
}

/**
 * Create the result object returned by wabi()
 * @param {Element[]} elements - Affected elements
 * @param {object} [options] - Applied options
 * @returns {object} - Result object
 */
function createResult(elements, options) {
  return {
    elements,
    restore: () => restoreElements(elements),
    update: () => updateElements(elements),
    setOptions: (newOptions) => setElementOptions(elements, newOptions),
  };
}
