/**
 * Global animation loop using requestAnimationFrame
 */
export class Loop {
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
export const loop = new Loop();
