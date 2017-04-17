import lodash from 'lodash';

export default function cleanEntry(entryObj) {
  if (entryObj instanceof Array) return entryObj.map(cleanEntry);
  return lodash.chain(entryObj)
    .omit('controls')
    .mapValues((value) => {
      // cleanup booleans
      if (value === 'TRUE') { return true; }
      if (value === 'FALSE') { return false; }

      // if integer string, convert to number
      if (/^(-|\+)?\d+$/.test(value)) { return parseInt(value, 10); }

      // otherwise the regular value
      return value;
    }).value();
}
