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

/**
 * Wrap element with a container for shadow effect
 * Shadow must be on wrapper so it doesn't get clipped by clip-path
 * @param {Element} element - Element to wrap
 * @param {string} dropShadow - CSS drop-shadow filter value
 * @returns {Element} - The wrapper element
 */
function wrapElementForShadow(element, dropShadow) {
  // Check if already wrapped
  let wrapper = shadowWrappers.get(element);
  if (wrapper) {
    wrapper.style.filter = dropShadow;
    return wrapper;
  }

  // Create wrapper - must render as a box for filter to work
  // (display: contents would remove the box and filter wouldn't apply)
  wrapper = document.createElement("div");
  wrapper.className = "wabi-shadow-wrapper";
  wrapper.style.filter = dropShadow;

  // Insert wrapper and move element into it
  element.parentNode.insertBefore(wrapper, element);
  wrapper.appendChild(element);

  shadowWrappers.set(element, wrapper);
  return wrapper;
}

/**
 * Unwrap element from shadow wrapper
 * @param {Element} element - Element to unwrap
 */
function unwrapElement(element) {
  const wrapper = shadowWrappers.get(element);
  if (!wrapper) return;

  // Move element back to original position (before wrapper)
  wrapper.parentNode.insertBefore(element, wrapper);
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
    originalClipPaths.set(element, element.style.clipPath || "");
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
    const width = options.units === "%" ? 100 : element.offsetWidth;
    const height = options.units === "%" ? 100 : element.offsetHeight;

    const polygon = generatePolygon(width, height, options);
    const clipPath = generateClipPath(polygon, options.units);
    element.style.clipPath = clipPath;
  };

  regenerate();

  // Apply shadow via wrapper (so it doesn't get clipped by clip-path)
  const dropShadow = generateDropShadow(options.shadow);
  if (dropShadow) {
    wrapElementForShadow(element, dropShadow);
  } else {
    // Shadow disabled - unwrap if previously wrapped
    unwrapElement(element);
  }

  // Set up resize observer if needed
  if (options.preserveOnResize && options.units === "px") {
    const cleanup = setupResizeObserver(element, regenerate);
    resizeCleanups.set(element, cleanup);
  }

  // Store regenerate function for update()
  element._wabiRegenerate = regenerate;
  element._wabiOptions = options;
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

    // Clean up original filter tracking (no longer applied to element)
    originalFilters.delete(element);

    // Clean up resize observer
    const cleanup = resizeCleanups.get(element);
    if (cleanup) {
      cleanup();
      resizeCleanups.delete(element);
    }

    // Clean up stored functions
    delete element._wabiRegenerate;
    delete element._wabiOptions;
  });
}

/**
 * Update elements with new random values
 * @param {Element[]} elements - Elements to update
 */
function updateElements(elements) {
  elements.forEach((element) => {
    if (element._wabiRegenerate) {
      element._wabiRegenerate();
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
    if (element._wabiOptions) {
      // Build merged options manually to handle shadow correctly
      const mergedBase = {
        ...element._wabiOptions,
        ...newOptions,
        corners: {
          ...element._wabiOptions.corners,
          ...(newOptions.corners || {}),
        },
        edges: {
          ...element._wabiOptions.edges,
          ...(newOptions.edges || {}),
        },
      };

      // Handle shadow merging
      if (newOptions.shadow === false) {
        mergedBase.shadow = false;
      } else if (newOptions.shadow && typeof newOptions.shadow === "object") {
        mergedBase.shadow = {
          ...(element._wabiOptions.shadow || {}),
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
