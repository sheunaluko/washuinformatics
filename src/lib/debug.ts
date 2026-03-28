const store: Record<string, unknown> = {};

export const debug = {
  add(key: string, value: unknown) {
    store[key] = value;
    if (typeof window !== "undefined") {
      (window as unknown as Record<string, unknown>).__debug__ = store;
    }
  },
  get(key: string) {
    return store[key];
  },
  all() {
    return { ...store };
  },
};
