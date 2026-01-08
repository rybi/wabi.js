# wabi.js

A lightweight JavaScript library for adding organic geometric imperfection to HTML elements.

## How It Works

wabi.js uses CSS `clip-path: polygon()` to redefine the visible boundaries of HTML elements. Instead of perfect rectangular corners, it creates subtle random offsets that give elements an organic, hand-crafted feel.

## Installation

### For WordPress & Web Developers (Simple Setup)

Download `wabi.min.js` from the [dist folder](dist/) and add it to your site:

```html
<!-- Add this before </body> -->
<script src="/path/to/wabi.min.js"></script>
```

Or use the CDN:

```html
<script src="https://unpkg.com/wabi"></script>
```

### For NPM Users

```bash
npm install wabi
```

## Usage

### Simple Usage (WordPress, HTML Sites)

Add the script and call `wabi()` when the page loads:

```html
<!-- 1. Add the script before </body> -->
<script src="https://unpkg.com/wabi"></script>

<!-- 2. Call wabi() on your elements -->
<script>
  window.addEventListener('load', function() {<br>
    wabi('.my-cards', { corners: { x: 5, y: 4 } });<br>
  });
</script>
```

That's it! The effect is applied when the page loads.

### ES Modules (Bundlers, Modern JS)

```javascript
import wabi from 'wabi';<br>
<br>
const result = wabi('#myDiv', { corners: { x: 5, y: 4 } });<br>
result.restore(); // Restore original shape
```

### Shorthand Syntax

```javascript
// Inside your load event handler:<br>
wabi('#myDiv', 5, 4);  // Corner displacement only<br>
wabi('#myDiv', 5, 4, 2);  // Corner displacement + edge points
```

### With Edge Points

```javascript
wabi('.cards', {<br>
  corners: { x: 3, y: 3 },<br>
  edges: {<br>
    points: 2,      // 2 points per edge<br>
    deviation: 2    // max offset from edge line<br>
  }<br>
});
```

### With Shadow

Since `clip-path` clips `box-shadow`, wabi.js provides a built-in shadow option using `filter: drop-shadow()`:

```javascript
wabi('#card', {<br>
  corners: { x: 5, y: 4 },<br>
  shadow: {<br>
    x: 0,                      // horizontal offset (default: 0)<br>
    y: 4,                      // vertical offset (default: 4)<br>
    blur: 8,                   // blur radius (default: 8)<br>
    color: 'rgba(0,0,0,0.15)'  // shadow color<br>
  }<br>
});
```

> **Warning:** Enabling shadows wraps the target element in a DOM container to apply the shadow without clipping it. While wabi.js automatically copies layout styles (flex, grid, position, etc.) to this wrapper, this might still affect complex layouts or CSS selectors that depend on parent-child relationships. Test thoroughly when using shadows.

### Animation

Continuously randomize the shape at a given interval for a dynamic effect:

```html
<script>
  window.addEventListener('load', function() {<br>
    var result = wabi('.cards', { corners: { x: 5, y: 4 } });<br>
<br>
    // Start animation (default: 100ms interval)<br>
    result.animate();<br>
<br>
    // Or with custom interval<br>
    result.animate({ interval: 200 });<br>
<br>
    // Stop animation<br>
    result.stop();<br>
<br>
    // Check if animating<br>
    console.log(result.isAnimating); // true or false<br>
  });
</script>
```

You can also auto-start animation via options:

```javascript
// Auto-start with default 100ms interval<br>
wabi('.cards', { corners: { x: 5, y: 4 }, animate: true });<br>
<br>
// Auto-start with custom interval<br>
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
{<br>
  corners: {<br>
    x: 5,              // Max horizontal offset (default: 5)<br>
    y: 4,              // Max vertical offset (default: 4)<br>
    independent: true  // Each corner moves independently<br>
  },<br>
  edges: {<br>
    points: 0,         // Points per edge (default: 0, disabled)<br>
    deviation: 3,      // Max perpendicular offset<br>
    distribution: 'random'  // 'random' | 'even' | 'weighted-center'<br>
  },<br>
  shadow: {            // Shadow options (null or false = disabled)<br>
    x: 0,              // Horizontal offset in px (default: 0)<br>
    y: 4,              // Vertical offset in px (default: 4)<br>
    blur: 8,           // Blur radius in px (default: 8)<br>
    color: 'rgba(0,0,0,0.15)'  // Shadow color<br>
  },<br>
  cutCorners: 0,       // Number of corners (0-4) to cut off (default: 0)<br>
  cornerChamfer: 1,    // How far to cut corners, 0-1 (default: 1, full cut)<br>
  seed: null,          // Random seed for reproducibility<br>
  units: '%',          // 'px' or '%'<br>
  preserveOnResize: true,<br>
  wrapperClass: '',    // Custom class to add to shadow wrapper<br>
  animate: false       // true or { interval: 100 } to auto-start animation<br>
}
```

### Return Value

```javascript
{<br>
  elements: [...],      // Array of affected DOM elements<br>
  restore: Function,    // Remove effect, restore original<br>
  update: Function,     // Regenerate with new random values<br>
  setOptions: Function, // Update options and re-render<br>
  animate: Function,    // Start animation: animate({ interval: 100 })<br>
  stop: Function,       // Stop animation<br>
  isAnimating: boolean  // Whether animation is running<br>
}
```

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
