/**
 * Create a seeded random number generator using mulberry32 algorithm
 * @param {number} seed - The seed value
 * @returns {function} - A function that returns random numbers between 0 and 1
 */
export function createRNG(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Get a random number in a range
 * @param {function} rng - Random number generator function
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} - Random number between min and max
 */
export function randomInRange(rng, min, max) {
  return min + rng() * (max - min);
}

/**
 * Create a default RNG using Math.random or a seeded one
 * @param {number|null} seed - Optional seed value
 * @returns {function} - A random number generator function
 */
export function getRNG(seed) {
  if (seed === null || seed === undefined) {
    return Math.random;
  }
  return createRNG(seed);
}
