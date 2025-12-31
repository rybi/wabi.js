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

/**
 * Set up a resize observer for an element
 * @param {Element} element - Element to observe
 * @param {function} callback - Callback to run on resize
 * @returns {function} - Cleanup function to stop observing
 */
export function setupResizeObserver(element, callback) {
  // Modern approach: ResizeObserver
  if (typeof ResizeObserver !== "undefined") {
    const debouncedCallback = debounce(callback, 100);
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === element) {
          debouncedCallback();
        }
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }

  // Fallback: window resize event
  const handler = debounce(() => callback(), 100);
  window.addEventListener("resize", handler);
  return () => window.removeEventListener("resize", handler);
}
