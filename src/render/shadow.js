/**
 * Default shadow options (used when shadow is enabled without specifics)
 */
export const defaultShadowOptions = {
  x: 0,
  y: 4,
  blur: 8,
  color: "rgba(0,0,0,0.15)",
};

/**
 * Generate a CSS drop-shadow filter string
 * @param {object|false|null} shadowOptions - Shadow configuration
 * @returns {string|null} - CSS filter string or null if disabled
 */
export function generateDropShadow(shadowOptions) {
  // Explicitly disabled or not set
  if (!shadowOptions || shadowOptions === false) {
    return null;
  }

  // Merge with defaults
  const {
    x = defaultShadowOptions.x,
    y = defaultShadowOptions.y,
    blur = defaultShadowOptions.blur,
    color = defaultShadowOptions.color,
  } = shadowOptions;

  return `drop-shadow(${x}px ${y}px ${blur}px ${color})`;
}

/**
 * Combine drop-shadow with existing filter value
 * @param {string} existingFilter - Current filter value
 * @param {string|null} dropShadow - New drop-shadow to add
 * @returns {string} - Combined filter string
 */
export function combineFilters(existingFilter, dropShadow) {
  if (!dropShadow) {
    return existingFilter || "";
  }

  if (!existingFilter || existingFilter === "none") {
    return dropShadow;
  }

  // Append drop-shadow to existing filters
  return `${existingFilter} ${dropShadow}`;
}
