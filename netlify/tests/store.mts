import { vi } from "vitest";

/**
 * An in-memory stand-in for Netlify Blobs.
 *
 * Deliberately only implements what the real client offers — notably *not*
 * conditional writes, since the absence of those is what the storage layout
 * is built around. If this fake grew an `onlyIfMatch` the tests would stop
 * telling the truth about production.
 */
export function createFakeStore() {
  const blobs = new Map<string, string>();
  let counter = 0;
  const etags = new Map<string, string>();

  const put = (key: string, value: string) => {
    blobs.set(key, value);
    etags.set(key, `e${++counter}`);
  };

  const store = {
    async get(key: string, options?: { type?: string }) {
      const raw = blobs.get(key);
      if (raw === undefined) return null;
      return options?.type === "json" ? JSON.parse(raw) : raw;
    },
    async getMetadata(key: string) {
      if (!blobs.has(key)) return null;
      return { etag: etags.get(key), metadata: {} };
    },
    async set(key: string, value: string) {
      put(key, value);
    },
    async delete(key: string) {
      blobs.delete(key);
      etags.delete(key);
    },
    async list({ prefix = "" }: { prefix?: string } = {}) {
      return {
        blobs: [...blobs.keys()]
          .filter((key) => key.startsWith(prefix))
          .map((key) => ({ key, etag: etags.get(key) ?? "" })),
        directories: [],
      };
    },
  };

  return {
    store,
    reset() {
      blobs.clear();
      etags.clear();
      counter = 0;
    },
    keys: () => [...blobs.keys()],
    raw: blobs,
  };
}

export const fake = createFakeStore();

vi.mock("@netlify/blobs", () => ({
  getStore: () => fake.store,
}));
