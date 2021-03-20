import cleanEntry from './cleanEntry.js';

describe('cleanEntry', () => {
  it('converts numeric strings to actual numbers', () => {
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

    expect(cleanEntry(obj)).toEqual(expected);
  });
  it('cleanEntry(listOfObjects) cleans the whole list', () => {
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

    expect(cleanedList).toEqual(expected);
  });

  it('does not convert "numbers" with leading zeros to integers', () => {
    expect(cleanEntry({ id: '123', phone: '00491234567' })).toEqual({
      id: 123,
      phone: '00491234567',
    });
  });

  it('converts 0 to an integer', () => {
    expect(cleanEntry({ temp: '0' })).toEqual({ temp: 0 });
  });
});
