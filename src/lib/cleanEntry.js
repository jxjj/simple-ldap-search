export default function cleanEntry(entryObj) {
  if (entryObj instanceof Array) return entryObj.map(cleanEntry);

  // omit controls
  const { controls, ...rest } = entryObj;

  return Object.keys(rest).reduce((acc, key) => {
    const value = rest[key];
    // cleanup booleans
    if (value === 'TRUE') {
      return { ...acc, [key]: true };
    }
    if (value === 'FALSE') {
      return { ...acc, [key]: false };
    }

    // if integer string, convert to number
    // numbers that begin with a leading "0" like "0012345"
    // will be left as strings.
    // Zero will still be converted to 0.
    if (/^(-|\+)?(0|[1-9]\d*)$/.test(value)) {
      return { ...acc, [key]: parseInt(value, 10) };
    }

    // otherwise the regular value
    return { ...acc, [key]: value };
  }, {});
}
