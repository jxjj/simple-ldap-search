/**
 * Tests if a function exists within an array
 * @param {*} arr 
 * @param {*} fn 
 */
export default function arrayIncludesFunction(arr, fn) {
  if (typeof fn !== "function") throw TypeError(`Function '${fn} is not a function`);
  return !!arr.find(el => el.toString() === fn.toString());
}