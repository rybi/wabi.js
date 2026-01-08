/**
 * Manages the wrapper element for applying shadows without clipping.
 */
export class ShadowManager {
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
export const shadowManager = new ShadowManager();
