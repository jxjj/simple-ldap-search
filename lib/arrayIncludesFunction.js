/**
 * Tests if a function exists within an array
 * @param {*} arr - the array
 * @param {*} fn - function to test for inclusion within array
 */
export default function arrayIncludesFunction(arr, fn) {
  if (typeof fn !== 'function') {
    throw TypeError(`Function '${fn} is not a function`);
  }
  return !!arr.find((el) => el.toString() === fn.toString());
}
