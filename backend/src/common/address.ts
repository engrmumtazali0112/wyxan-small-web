// Addresses are single strings like "tidepool.zz": lowercase label(s) + ".zz".
export const ADDRESS_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*(\.[a-z0-9]+(-[a-z0-9]+)*)*\.zz$/;

export function normalizeAddress(input: string): string {
  return input.trim().toLowerCase();
}

export function isValidAddress(input: string): boolean {
  const a = normalizeAddress(input);
  return a.length <= 80 && ADDRESS_REGEX.test(a);
}
