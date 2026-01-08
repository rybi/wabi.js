import { mergeOptions, parseShorthand, generatePolygon } from "../math/polygon.js";
import { normalizeSelector } from "../utils/selector.js";
import { setupResizeObserver } from "../utils/resize.js";
import { generateClipPath, generateDropShadow } from "../utils/css.js";
import { shadowManager } from "../dom/ShadowManager.js";
import { loop } from "../anim/Loop.js";

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

export class Wabi {
    constructor(selector, optionsOrCornerX, cornerY, edgePoints) {
        this.elements = normalizeSelector(selector);

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
