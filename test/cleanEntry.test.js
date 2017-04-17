import test from 'ava';
import cleanEntry from '../src/lib/cleanEntry';

test('cleanData(obj) converts numeric strings to actual numbers', (t) => {
  const obj = {
    name: 'James',
    id: '12345',
    activeEmail: 'TRUE',
  };

  const expected = {
    name: 'James',
    id: 12345,
    activeEmail: true,
  };

  t.deepEqual(cleanEntry(obj), expected);
});

test('cleanEntry(listOfObjects) cleans the whole list', (t) => {
  const filthyList = [
    { a: 'James', b: '123', c: 'FALSE' },
    { a: 123, b: 'TRUE', c: '+456' },
    { a: NaN, b: null, c: '-12345' },
  ];
  const cleanedList = cleanEntry(filthyList);
  const expected = [
    { a: 'James', b: 123, c: false },
    { a: 123, b: true, c: 456 },
    { a: NaN, b: null, c: -12345 },
  ];

  t.deepEqual(cleanedList, expected);
});