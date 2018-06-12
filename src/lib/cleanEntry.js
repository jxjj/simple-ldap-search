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
    if (/^(-|\+)?\d+$/.test(value)) {
      return { ...acc, [key]: parseInt(value, 10) };
    }

    // otherwise the regular value
    return { ...acc, [key]: value };
  }, {});
}
