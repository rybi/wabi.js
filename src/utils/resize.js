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
 * @returns {function} - Cleanup function to stop observing
 */
export function setupResizeObserver(element, callback) {
  // Modern approach: ResizeObserver
  if (typeof ResizeObserver !== "undefined") {
    if (!sharedResizeObserver) {
      sharedResizeObserver = new ResizeObserver(debounce(handleResizeEntries, 20));
    }

    // Debounce the individual callback too to prevent thrashing
    const debouncedCallback = debounce(callback, 100);
    resizeCallbacks.set(element, debouncedCallback);
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
  windowResizeCallbacks.add(debouncedCallback);

  return () => {
    windowResizeCallbacks.delete(debouncedCallback);
    // Optional: remove window listener if set is empty, but maybe not strictly necessary for this scope
    if (windowResizeCallbacks.size === 0 && sharedWindowHandler) {
      window.removeEventListener("resize", sharedWindowHandler);
      sharedWindowHandler = null;
    }
  };
}
