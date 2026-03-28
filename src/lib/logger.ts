export function get_logger({ id }: { id: string }) {
  return function log(...args: unknown[]) {
    console.log(`[${id}]`, ...args);
  };
}
