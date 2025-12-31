# wabi.js - Implementation Plan

A lightweight JavaScript library for adding organic geometric imperfection to HTML elements.

---

## 1. Core Concept & Approach

### The Fundamental Technique

Use CSS `clip-path: polygon(...)` to redefine the visible boundaries of any HTML element. Instead of the default rectangular shape (four corners), we define a custom polygon where:

- Corner points are offset randomly from their true positions
- Additional points are inserted along edges with slight deviations

### Why `clip-path`?

- Works on any HTML element (divs, images, buttons, etc.)
- Preserves all element functionality (clicks, hover, content)
- GPU-accelerated, performant
- Supports percentage and pixel values
- Can be animated via CSS transitions or JS

### Limitations to Document

- `clip-path` clips the element visually but doesn't affect layout (element still occupies rectangular space)
- Overflow content is clipped
- Borders are clipped too (may need to use `box-shadow` or pseudo-elements for "border" effects)
- Older browser support (IE11 doesn't support `clip-path`)

---

## 2. API Design

### Unified Function Signature

```text
wabi(selector, options);
```

### Parameters

ParameterTypeDescription`selectorstring | Element | NodeList`CSS selector, DOM element, or collection`optionsobject`Configuration object (see below)

### Options Object

```text
{
  // Corner displacement
  corners: {
    x: 5,           // Max horizontal offset in pixels (or '%')
    y: 4,           // Max vertical offset in pixels (or '%')
    independent: true  // Each corner moves independently (vs. uniform skew)
  },
  
  // Edge complexity (points per edge)
  edges: {
    points: 2,      // Number of additional points per edge (0 = disabled)
    deviation: 3,   // Max perpendicular deviation from true edge line
    distribution: 'random' // 'random' | 'even' | 'weighted-center'
  },
  
  // Animation
  animate: {
    enabled: false,
    duration: 2000,    // ms for one "drift" cycle
    easing: 'ease-in-out',
    mode: 'drift'      // 'drift' (continuous) | 'jitter' (rapid small movements)
  },
  
  // Behavior
  seed: null,         // Random seed for reproducibility (null = true random)
  units: 'px',        // 'px' | '%'
  preserveOnResize: true  // Recalculate on window resize
}
```

### Shorthand Signatures

```text
// Quick corner-only displacement
wabi("#myDiv", 5, 4);
// Equivalent to: wabi("#myDiv", { corners: { x: 5, y: 4 } })

// Quick with edge points
wabi("#myDiv", 5, 4, 2);
// Equivalent to: { corners: { x: 5, y: 4 }, edges: { points: 2 } }
```

### Return Value

```text
{
  elements: [...],     // Array of affected DOM elements
  restore: Function,   // Removes effect, restores original clip-path
  update: Function,    // Regenerate with new random values
  setOptions: Function // Update options and re-render
}
```

---

## 3. Internal Architecture

### Module Structure

```text
wabi/
├── src/
│   ├── index.js           # Main entry, API exposure
│   ├── core/
│   │   ├── polygon.js     # Polygon point generation
│   │   ├── corners.js     # Corner displacement logic
│   │   ├── edges.js       # Edge point insertion logic
│   │   └── random.js      # Seeded random number generator
│   ├── render/
│   │   ├── clipPath.js    # Generate clip-path CSS string
│   │   └── apply.js       # Apply to DOM elements
│   ├── animation/
│   │   ├── drift.js       # Continuous drift animation
│   │   └── jitter.js      # Rapid jitter animation
│   └── utils/
│       ├── selector.js    # Normalize selector input
│       ├── units.js       # Unit conversion helpers
│       └── resize.js      # Resize observer handler
├── dist/
│   ├── wabi.min.js        # UMD bundle
│   └── wabi.esm.js        # ES module bundle
└── package.json
```

### Core Algorithm Flow

```text
┌─────────────────────────────────────────────────────────────┐
│                        wabi() called                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  1. PARSE INPUT                                              │
│     - Normalize selector → array of DOM elements             │
│     - Merge options with defaults                            │
│     - Initialize seeded RNG if seed provided                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  2. FOR EACH ELEMENT                                         │
│     ┌─────────────────────────────────────────────────────┐ │
│     │ 2a. Get element dimensions (for % calculations)     │ │
│     └─────────────────────────────────────────────────────┘ │
│                            │                                 │
│                            ▼                                 │
│     ┌─────────────────────────────────────────────────────┐ │
│     │ 2b. Generate base corner points (4 corners)         │ │
│     │     [0,0] [100%,0] [100%,100%] [0,100%]             │ │
│     └─────────────────────────────────────────────────────┘ │
│                            │                                 │
│                            ▼                                 │
│     ┌─────────────────────────────────────────────────────┐ │
│     │ 2c. Apply corner displacement                       │ │
│     │     - For each corner, offset x by random(-cx, +cx) │ │
│     │     - Offset y by random(-cy, +cy)                  │ │
│     │     - Clamp to valid range (0-100% or element size) │ │
│     └─────────────────────────────────────────────────────┘ │
│                            │                                 │
│                            ▼                                 │
│     ┌─────────────────────────────────────────────────────┐ │
│     │ 2d. Insert edge points (if edges.points > 0)        │ │
│     │     - For each edge (top, right, bottom, left):     │ │
│     │       - Calculate N positions along edge            │ │
│     │       - Offset each perpendicular to edge           │ │
│     │       - Insert into polygon point array             │ │
│     └─────────────────────────────────────────────────────┘ │
│                            │                                 │
│                            ▼                                 │
│     ┌─────────────────────────────────────────────────────┐ │
│     │ 2e. Generate clip-path string                       │ │
│     │     "polygon(x1 y1, x2 y2, x3 y3, ...)"            │ │
│     └─────────────────────────────────────────────────────┘ │
│                            │                                 │
│                            ▼                                 │
│     ┌─────────────────────────────────────────────────────┐ │
│     │ 2f. Apply to element.style.clipPath                 │ │
│     │     Store original clipPath for restore()           │ │
│     └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  3. SETUP ANIMATION (if enabled)                             │
│     - Store target points for interpolation                  │
│     - Start requestAnimationFrame loop or CSS transition     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  4. SETUP RESIZE OBSERVER (if preserveOnResize)              │
│     - Recalculate on element/window resize                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  5. RETURN control object { elements, restore, update, ... } │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Detailed Algorithm: Polygon Generation

### 4.1 Corner Displacement

```text
For a rectangle with corners at:
  TL (top-left):     [0, 0]
  TR (top-right):    [W, 0]
  BR (bottom-right): [W, H]
  BL (bottom-left):  [0, H]

Where W = width, H = height (100% or pixel value)

Displacement formula for each corner:
  new_x = original_x + random(-offset_x, +offset_x)
  new_y = original_y + random(-offset_y, +offset_y)

Clamping (to prevent points going outside element bounds):
  - TL: x ∈ [0, offset_x], y ∈ [0, offset_y]
  - TR: x ∈ [W - offset_x, W], y ∈ [0, offset_y]
  - BR: x ∈ [W - offset_x, W], y ∈ [H - offset_y, H]
  - BL: x ∈ [0, offset_x], y ∈ [H - offset_y, H]

Note: Clamping is optional - allowing points outside creates more dramatic effects
but may clip content unexpectedly.
```

### 4.2 Edge Point Insertion

```text
For edge from point A to point B, inserting N points:

1. CALCULATE POSITIONS ALONG EDGE
   
   Distribution modes:
   
   a) 'even': Points at equal intervals
      positions = [1/(N+1), 2/(N+1), ..., N/(N+1)]
      
   b) 'random': Random positions (sorted)
      positions = sort([random(0.1, 0.9) for i in 1..N])
      
   c) 'weighted-center': More points toward center
      Use gaussian distribution centered at 0.5

2. CALCULATE POINT COORDINATES
   
   For each position t ∈ [0, 1]:
     point_on_line = A + t * (B - A)
     point_on_line = [A.x + t*(B.x - A.x), A.y + t*(B.y - A.y)]

3. CALCULATE PERPENDICULAR OFFSET
   
   Edge vector: V = B - A = [B.x - A.x, B.y - A.y]
   Perpendicular (normalized): P = [-V.y, V.x] / |V|
   
   For horizontal edges (top/bottom): perpendicular is vertical
   For vertical edges (left/right): perpendicular is horizontal
   
   Offset amount: d = random(-deviation, +deviation)
   
   Final point: point_on_line + d * P

4. INSERT INTO POLYGON ARRAY
   
   Original: [TL, TR, BR, BL]
   
   After inserting 2 points per edge:
   [TL, top_p1, top_p2, TR, right_p1, right_p2, BR, bottom_p1, bottom_p2, BL, left_p1, left_p2]
   
   Note: Bottom and left edges go in reverse direction, so points 
   should be inserted in reverse order to maintain clockwise winding.
```

### 4.3 Polygon Winding Order

```text
clip-path polygon requires consistent winding order (clockwise or counter-clockwise).

Standard clockwise order starting from top-left:

    TL ──────────────────► TR
    ▲                       │
    │                       │
    │                       ▼
    BL ◄────────────────── BR

With edge points (2 per edge):

    TL ──► T1 ──► T2 ──► TR
    ▲                      │
    L2                     R1
    │                      │
    L1                     R2
    │                      ▼
    BL ◄── B2 ◄── B1 ◄── BR

Array order: [TL, T1, T2, TR, R1, R2, BR, B1, B2, BL, L1, L2]
```

---

## 5. Detailed Algorithm: Animation

### 5.1 Drift Animation

Smooth, continuous movement where points slowly wander within their allowed range.

```text
DRIFT ALGORITHM:

1. INITIALIZATION
   - Generate initial polygon points (P_current)
   - Generate target polygon points (P_target)
   - Set interpolation progress t = 0

2. ANIMATION LOOP (requestAnimationFrame)
   
   Each frame:
     a) Increment t based on elapsed time and duration
        t += deltaTime / duration
     
     b) Apply easing function
        t_eased = easing(t)  // e.g., ease-in-out
     
     c) Interpolate all points
        For each point i:
          P_interpolated[i] = lerp(P_current[i], P_target[i], t_eased)
     
     d) Generate and apply clip-path string
     
     e) If t >= 1:
        - P_current = P_target
        - Generate new P_target (new random offsets)
        - Reset t = 0

3. INTERPOLATION FUNCTION
   lerp(a, b, t) = a + (b - a) * t
   
   For points:
   lerp([x1,y1], [x2,y2], t) = [x1 + (x2-x1)*t, y1 + (y2-y1)*t]
```

### 5.2 Jitter Animation

Rapid, small movements creating a "nervous" or hand-drawn feel.

```text
JITTER ALGORITHM:

1. INITIALIZATION
   - Generate base polygon points (P_base)
   - Set jitter_amount = deviation * jitter_intensity

2. ANIMATION LOOP (requestAnimationFrame, throttled to ~30fps)
   
   Each frame:
     a) For each point, add small random offset to base position
        P_jittered[i] = P_base[i] + [random(-j, j), random(-j, j)]
        where j = jitter_amount
     
     b) Generate and apply clip-path string

3. OPTIONAL: Perlin noise for smoother jitter
   Instead of pure random, use 2D Perlin noise sampled at 
   (point_index, time) for more organic movement.
```

### 5.3 CSS Transition Alternative

For simpler animation without requestAnimationFrame:

```text
.wabified {
  transition: clip-path 2s ease-in-out;
}
```

```text
// Change clip-path periodically, let CSS handle interpolation
setInterval(() => {
  element.style.clipPath = generateNewPolygon();
}, 2000);
```

Pros: Simpler, GPU-accelerated Cons: Less control, can't do complex easing per-point

---

## 6. Seeded Random Number Generator

For reproducible results (same seed = same "randomness"):

```text
// Simple mulberry32 PRNG
function createRNG(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Usage
const rng = createRNG(12345);
rng(); // Always returns same sequence for seed 12345

// Utility: random in range
function randomInRange(rng, min, max) {
  return min + rng() * (max - min);
}
```

---

## 7. Handling Units

### Percentage vs Pixels

```text
// Percentage mode (default, responsive)
clip-path: polygon(
  2% 1%,      // TL offset
  48% -1%,    // top edge point
  98% 2%,     // TR offset
  ...
);

// Pixel mode (fixed, precise)
// Requires knowing element dimensions
const rect = element.getBoundingClientRect();
clip-path: polygon(
  5px 3px,
  150px -2px,
  295px 4px,
  ...
);
```

### Conversion Helper

```text
function toPixels(value, dimension, unit) {
  if (unit === '%') {
    return (value / 100) * dimension;
  }
  return value;
}

function toPercent(value, dimension) {
  return (value / dimension) * 100;
}
```

---

## 8. Resize Handling

```text
function setupResizeObserver(element, recalculate) {
  // Modern approach: ResizeObserver
  if (typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        recalculate(entry.target);
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }
  
  // Fallback: window resize (less precise)
  const handler = debounce(() => recalculate(element), 100);
  window.addEventListener('resize', handler);
  return () => window.removeEventListener('resize', handler);
}
```

---

## 9. Edge Cases & Considerations

### 9.1 Nested Chaotized Elements

- Child elements are clipped by parent's clip-path
- May need to apply inverse transform or separate handling

### 9.2 Elements with Border-Radius

- `clip-path` overrides `border-radius`
- Document this limitation
- Future: Could generate curved polygon approximations

### 9.3 Inline Elements

- `clip-path` works best on block/inline-block elements
- Inline elements may have unexpected results

### 9.4 Transformed Elements

- `clip-path` is applied after CSS transforms
- Rotated/scaled elements work correctly

### 9.5 Performance

- Many animated elements = many requestAnimationFrame callbacks
- Consider batching updates
- Use `will-change: clip-path` for GPU acceleration hint

### 9.6 Accessibility

- Visual effect only, doesn't affect screen readers
- Ensure sufficient contrast despite irregular edges
- Consider `prefers-reduced-motion` media query

```text
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  options.animate.enabled = false;
}
```

---

## 10. Build & Distribution

### 10.1 Build Tools

- **Bundler**: Rollup (lightweight, good for libraries)
- **Transpiler**: Babel (for older browser support)
- **Minifier**: Terser

### 10.2 Output Formats

```text
// UMD (Universal Module Definition) - works everywhere
// dist/wabi.min.js
(function(global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined'
    ? module.exports = factory()
    : typeof define === 'function' && define.amd
      ? define(factory)
      : (global.wabi = factory());
}(this, function() { /* ... */ }));

// ES Module - modern bundlers
// dist/wabi.esm.js
export { wabi, wabi as default };

// CommonJS - Node.js
// dist/wabi.cjs.js
module.exports = wabi;
```

### 10.3 Package.json Fields

```text
{
  "name": "wabi",
  "version": "1.0.0",
  "main": "dist/wabi.cjs.js",
  "module": "dist/wabi.esm.js",
  "browser": "dist/wabi.min.js",
  "unpkg": "dist/wabi.min.js",
  "types": "dist/wabi.d.ts",
  "files": ["dist"],
  "sideEffects": false
}
```

### 10.4 TypeScript Definitions

```text
// wabi.d.ts
interface WabiCornerOptions {
  x?: number;
  y?: number;
  independent?: boolean;
}

interface WabiEdgeOptions {
  points?: number;
  deviation?: number;
  distribution?: 'random' | 'even' | 'weighted-center';
}

interface WabiAnimateOptions {
  enabled?: boolean;
  duration?: number;
  easing?: string;
  mode?: 'drift' | 'jitter';
}

interface WabiOptions {
  corners?: WabiCornerOptions;
  edges?: WabiEdgeOptions;
  animate?: WabiAnimateOptions;
  seed?: number | null;
  units?: 'px' | '%';
  preserveOnResize?: boolean;
}

interface WabiResult {
  elements: HTMLElement[];
  restore: () => void;
  update: () => void;
  setOptions: (options: Partial<WabiOptions>) => void;
}

declare function wabi(
  selector: string | Element | NodeList,
  options?: WabiOptions
): WabiResult;

declare function wabi(
  selector: string | Element | NodeList,
  cornerX: number,
  cornerY: number,
  edgePoints?: number
): WabiResult;

export { wabi, WabiOptions, WabiResult };
export default wabi;
```