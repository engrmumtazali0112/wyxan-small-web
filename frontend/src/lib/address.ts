// Same rule as backend/src/common/address.ts. A link inside a page is only ever one of these.
export const ADDRESS_RE = /^[a-z0-9]+(-[a-z0-9]+)*(\.[a-z0-9]+(-[a-z0-9]+)*)*\.zz$/;

export function normalizeAddress(input: string): string {
  return input.trim().toLowerCase();
}

export function isValidAddress(input: string): boolean {
  const a = normalizeAddress(input);
  return a.length <= 80 && ADDRESS_RE.test(a);
}