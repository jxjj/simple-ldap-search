import test from 'ava';
import addListenerIfNotAdded from '../src/lib/addListenerIfNotAdded';
import { EventEmitter } from 'events';
import { emit } from 'cluster';

test('adds listener if not in event emitter list', t => {
  const emitter = new EventEmitter();
  t.is(emitter.listenerCount('test'),0);

  const sum = (a, b) => a + b; 
  addListenerIfNotAdded(emitter, 'test', sum);

  t.is(emitter.listenerCount('test'), 1);
});

test('does not add listener if already in event emitter list', t => {
  const emitter = new EventEmitter();
  t.is(emitter.listenerCount('test'), 0);

  const sum = (a, b) => a + b; 
  addListenerIfNotAdded(emitter, 'test', sum);
  t.is(emitter.listenerCount('test'), 1);
  addListenerIfNotAdded(emitter, 'test', sum);
  t.is(emitter.listenerCount('test'), 1);
});