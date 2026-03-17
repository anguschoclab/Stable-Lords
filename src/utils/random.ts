export function getSecureSeed() {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0];
  }
  return Math.floor(Math.random() * 4294967296);
}
