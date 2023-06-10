export function delayMs(millisecond: number) {
  return new Promise((resolve) => setTimeout(resolve, millisecond));
}
