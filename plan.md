# wabi.js Known Limitations

## Shadow Wrapper Breaks DOM Structure

**Problem:** When using `shadow: true`, wabi.js creates a wrapper `<div class="wabi-shadow-wrapper">` around the element. This changes the DOM structure, which can break:
- CSS selectors targeting the element's parent
- CSS Grid/Flexbox layouts that depend on direct child relationships
- JavaScript code that traverses the DOM

**Why this exists:** CSS `drop-shadow()` filter applied directly to an element gets clipped by `clip-path`. The only way to show an unclipped shadow is to apply the filter to a parent element.

**Workarounds:**
- Use `:has()` selector to target wrapper: `.wabi-shadow-wrapper:has(.my-element)`
- Account for extra nesting in CSS grid/flex layouts
- Use `shadow: false` if DOM structure is critical
