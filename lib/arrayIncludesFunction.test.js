/* eslint no-console: off */
import arrayIncludesFunction from './arrayIncludesFunction.js';

describe('arrayIncludesFunction', () => {
  it('is false if function is not in list', () => {
    const arr = [1, console.log, 3, () => {}];
    const testFn = (msg) => console.log(msg);
    expect(arrayIncludesFunction(arr, testFn)).toBeFalsy();
  });

  it('is true if function is in list', () => {
    const arr = [1, console.log, 3, () => {}];
    expect(arrayIncludesFunction(arr, console.log)).toBe(true);
  });

  it('is true if reference points to same fn', () => {
    const arr = [1, console.log, 3, () => {}];
    const print = console.log;
    expect(arrayIncludesFunction(arr, print)).toBe(true);
  });

  it('is false if exists by different name', () => {
    const arr = [
      1,
      function print1(msg) {
        console.log(msg);
      },
      3,
      () => {},
    ];

    function print2(msg) {
      console.log(msg);
    }

    expect(arrayIncludesFunction(arr, print2)).toBe(false);
  });
});
