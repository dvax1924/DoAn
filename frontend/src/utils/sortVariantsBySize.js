export const SIZE_ORDER = ['M', 'L', 'XL'];

export const sortVariantsBySize = (variants = []) => {
  return [...variants].sort((a, b) => {
    const aIndex = SIZE_ORDER.indexOf(a.size);
    const bIndex = SIZE_ORDER.indexOf(b.size);
    const normalizedAIndex = aIndex === -1 ? SIZE_ORDER.length : aIndex;
    const normalizedBIndex = bIndex === -1 ? SIZE_ORDER.length : bIndex;

    if (normalizedAIndex !== normalizedBIndex) {
      return normalizedAIndex - normalizedBIndex;
    }

    return a.size.localeCompare(b.size);
  });
};
