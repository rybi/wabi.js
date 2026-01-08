# wabi.js

A lightweight JavaScript library for adding organic geometric imperfection to HTML elements.

Inspired by [wabi-sabi](https://en.wikipedia.org/wiki/Wabi-sabi) (侘寂) - the Japanese aesthetic that finds beauty in imperfection.

## Installation

```bash
npm install wabi
```

Or include directly via CDN:

```html
<script src="https://unpkg.com/wabi"></script>
```

## Usage

### Basic Usage

```javascript
import wabi from 'wabi';

// Apply to elements using CSS selector
const result = wabi('#myDiv', { corners: { x: 5, y: 4 } });

// Restore original shape
result.restore();
```

### Shorthand Syntax

```javascript
// Corner displacement only
wabi('#myDiv', 5, 4);

// Corner displacement + edge points
wabi('#myDiv', 5, 4, 2);
```

### With Edge Points

```javascript
wabi('.cards', {
  corners: { x: 3, y: 3 },
  edges: {
    points: 2,      // 2 points per edge
    deviation: 2    // max offset from edge line
  }
});
```

### With Shadow

Since `clip-path` clips `box-shadow`, wabi.js provides a built-in shadow option using `filter: drop-shadow()`:

```javascript
wabi('#card', {
  corners: { x: 5, y: 4 },
  shadow: {
    x: 0,                      // horizontal offset (default: 0)
    y: 4,                      // vertical offset (default: 4)
    blur: 8,                   // blur radius (default: 8)
    color: 'rgba(0,0,0,0.15)'  // shadow color
  }
});
```javascript
wabi('#card', {
  corners: { x: 5, y: 4 },
  shadow: {
    x: 0,                      // horizontal offset (default: 0)
    y: 4,                      // vertical offset (default: 4)
    blur: 8,                   // blur radius (default: 8)
    color: 'rgba(0,0,0,0.15)'  // shadow color
  }
});
```

> **Warning:** Enabling shadows wraps the target element in a DOM container to apply the shadow without clipping it. While wabi.js automatically copies layout styles (flex, grid, position, etc.) to this wrapper, this might still affect complex layouts or CSS selectors that depend on parent-child relationships. Test thoroughly when using shadows.

### Animation

Continuously randomize the shape at a given interval for a dynamic effect:

```javascript
const result = wabi('.cards', { corners: { x: 5, y: 4 } });

// Start animation (default: 100ms interval)
result.animate();

// Or with custom interval
result.animate({ interval: 200 });

// Stop animation
result.stop();

// Check if animating
result.isAnimating; // true or false
```

You can also auto-start animation via options:

```javascript
// Auto-start with default 100ms interval
wabi('.cards', { corners: { x: 5, y: 4 }, animate: true });

// Auto-start with custom interval
wabi('.cards', { corners: { x: 5, y: 4 }, animate: { interval: 200 } });
```

## API

### `wabi(selector, options)`

| Parameter | Type | Description |
|-----------|------|-------------|
| `selector` | `string \| Element \| NodeList` | CSS selector, DOM element, or collection |
| `options` | `object` | Configuration object |

### Options

```javascript
{
  corners: {
    x: 5,              // Max horizontal offset (default: 5)
    y: 4,              // Max vertical offset (default: 4)
    independent: true  // Each corner moves independently
  },
  edges: {
    points: 0,         // Points per edge (default: 0, disabled)
    deviation: 3,      // Max perpendicular offset
    distribution: 'random'  // 'random' | 'even' | 'weighted-center'
  },
  shadow: null,        // Shadow options (see below), null = disabled
  seed: null,          // Random seed for reproducibility
  units: '%',          // 'px' or '%'
  preserveOnResize: true,
  wrapperClass: '',    // Custom class to add to shadow wrapper
  animate: false       // true or { interval: 100 } to auto-start animation
}
```

#### Shadow Options

```javascript
shadow: {
  x: 0,                      // Horizontal offset in px
  y: 4,                      // Vertical offset in px
  blur: 8,                   // Blur radius in px
  color: 'rgba(0,0,0,0.15)'  // Shadow color
}
```

Set `shadow: false` to explicitly disable shadows.

### Return Value

```javascript
{
  elements: [...],      // Array of affected DOM elements
  restore: Function,    // Remove effect, restore original
  update: Function,     // Regenerate with new random values
  setOptions: Function, // Update options and re-render
  animate: Function,    // Start animation: animate({ interval: 100 })
  stop: Function,       // Stop animation
  isAnimating: boolean  // Whether animation is running
}
```

## How It Works

wabi.js uses CSS `clip-path: polygon()` to redefine the visible boundaries of HTML elements. Instead of perfect rectangular corners, it creates subtle random offsets that give elements an organic, hand-crafted feel.

## Browser Support

Works in all modern browsers that support `clip-path: polygon()`:
- Chrome 55+
- Firefox 54+
- Safari 9.1+
- Edge 79+

## Limitations

- `clip-path` clips visually but doesn't affect layout
- Borders are clipped (use the built-in `shadow` option for shadows)
- Overrides `border-radius`
- **Shadows**: Change DOM structure by wrapping element (see warning above)

## License

MIT
