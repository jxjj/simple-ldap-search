import arrayIncludesFunction from './arrayIncludesFunction.js';

/**
 * Adds an event listener to an emitter only if not already present
 *
 * @param {EventEmitter} eventEmitter - the event emitter we listen to
 * @param {String} eventName - the name of the event we're listening for
 * @param {Function} fn - the function to be invoked when event is emitted
 *
 * @example
 * new Promise((resolve, reject) => {
 *   addListenerIfNotAdded(ldapClient, 'error', reject);
 *   ...
 * })
 */
export default function addListenerIfNotAdded(eventEmitter, eventName, fn) {
  const listenersArray = eventEmitter.listeners(eventName);

  if (arrayIncludesFunction(listenersArray, fn)) return;

  eventEmitter.on(eventName, fn);
}
