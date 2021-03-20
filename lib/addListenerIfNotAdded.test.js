import { EventEmitter } from 'events';
import addListenerIfNotAdded from './addListenerIfNotAdded.js';

describe('addListenerIfNotAdded', () => {
  it('adds listener if not in event emitter list', () => {
    const emitter = new EventEmitter();
    expect(emitter.listenerCount('test')).toBe(0);

    const sum = (a, b) => a + b;
    addListenerIfNotAdded(emitter, 'test', sum);

    expect(emitter.listenerCount('test')).toBe(1);
  });

  test('does not add listener if already in event emitter list', () => {
    const emitter = new EventEmitter();
    expect(emitter.listenerCount('test')).toBe(0);

    const sum = (a, b) => a + b;
    addListenerIfNotAdded(emitter, 'test', sum);
    expect(emitter.listenerCount('test')).toBe(1);
    addListenerIfNotAdded(emitter, 'test', sum);
    expect(emitter.listenerCount('test')).toBe(1);
  });
});
