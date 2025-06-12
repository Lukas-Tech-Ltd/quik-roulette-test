const wrappedIndex = (index: number, length: number) => {
  const i = index % length;
  if (i < 0) {
    return length + i;
  } else if (i >= length) {
    return i - length;
  }
  return i;
};

export { wrappedIndex };
