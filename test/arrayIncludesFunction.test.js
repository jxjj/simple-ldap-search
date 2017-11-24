import test from 'ava';
import arrayIncludesFunction from '../src/lib/arrayIncludesFunction';

test('false if does not exist', t => {
    const arr = [
      1,
      console.log,
      3,
      function () {},
    ];

    const testFn = (msg) => console.log(msg);

    t.false(arrayIncludesFunction(arr,testFn));
});

test('true if exists', t => {
  const arr = [
    1,
    console.log,
    3,
    function () {},
  ];

  t.true(arrayIncludesFunction(arr,console.log));
});

test('true if reference points to same fn', t => {
  const arr = [
    1,
    console.log,
    3,
    function () {},
  ];

  const print = console.log;

  t.true(arrayIncludesFunction(arr, print));
});

test('false if exists by different name', t => {
  const arr = [
    1,
    function print1(msg) { console.log(msg) },
    3,
    function () {},
  ];

  function print2(msg) { console.log(msg) }

  t.false(arrayIncludesFunction(arr, print2));
});

