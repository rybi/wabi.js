/**
 * Options for corner displacement
 */
interface WabiCornerOptions {
  /** Maximum horizontal displacement (default: 5) */
  x?: number;
  /** Maximum vertical displacement (default: 4) */
  y?: number;
  /** Whether each corner moves independently (default: true) */
  independent?: boolean;
}

/**
 * Options for edge point insertion
 */
interface WabiEdgeOptions {
  /** Number of points to insert per edge (default: 0) */
  points?: number;
  /** Maximum perpendicular deviation from edge line (default: 3) */
  deviation?: number;
  /** Distribution of edge points: 'random' | 'even' | 'weighted-center' (default: 'random') */
  distribution?: "random" | "even" | "weighted-center";
}

/**
 * Options for drop-shadow effect (works with clip-path)
 */
interface WabiShadowOptions {
  /** Horizontal shadow offset in pixels (default: 0) */
  x?: number;
  /** Vertical shadow offset in pixels (default: 4) */
  y?: number;
  /** Shadow blur radius in pixels (default: 8) */
  blur?: number;
  /** Shadow color (default: 'rgba(0,0,0,0.15)') */
  color?: string;
}

/**
 * Main options for wabi()
 */
interface WabiOptions {
  /** Corner displacement settings */
  corners?: WabiCornerOptions;
  /** Edge point insertion settings */
  edges?: WabiEdgeOptions;
  /** Shadow settings (uses filter: drop-shadow). Set to false to disable, null/undefined for default (disabled) */
  shadow?: WabiShadowOptions | false | null;
  /** Random seed for reproducible results (null for true random) */
  seed?: number | null;
  /** Unit type: 'px' or '%' (default: '%') */
  units?: "px" | "%";
  /** Recalculate on element resize (default: true) */
  preserveOnResize?: boolean;
}

/**
 * Result object returned by wabi()
 */
interface WabiResult {
  /** Array of affected DOM elements */
  elements: HTMLElement[];
  /** Remove effect and restore original clip-path */
  restore: () => void;
  /** Regenerate with new random values */
  update: () => void;
  /** Update options and re-render */
  setOptions: (options: Partial<WabiOptions>) => void;
}

/**
 * Apply organic geometric imperfection to HTML elements
 *
 * @param selector - CSS selector, DOM element, or NodeList
 * @param options - Configuration options
 * @returns Control object with restore, update, setOptions methods
 *
 * @example
 * // Basic usage
 * const result = wabi('#myDiv', { corners: { x: 5, y: 4 } });
 *
 * // Restore original
 * result.restore();
 */
declare function wabi(
  selector: string | Element | NodeList | HTMLCollection | Element[],
  options?: WabiOptions
): WabiResult;

/**
 * Apply organic geometric imperfection using shorthand syntax
 *
 * @param selector - CSS selector, DOM element, or NodeList
 * @param cornerX - Maximum horizontal corner displacement
 * @param cornerY - Maximum vertical corner displacement
 * @param edgePoints - Number of edge points per edge (optional)
 * @returns Control object with restore, update, setOptions methods
 *
 * @example
 * // Shorthand usage
 * wabi('#myDiv', 5, 4);     // corners only
 * wabi('#myDiv', 5, 4, 2);  // corners + 2 edge points per edge
 */
declare function wabi(
  selector: string | Element | NodeList | HTMLCollection | Element[],
  cornerX: number,
  cornerY: number,
  edgePoints?: number
): WabiResult;

export { wabi, WabiOptions, WabiResult, WabiCornerOptions, WabiEdgeOptions, WabiShadowOptions };
export default wabi;
