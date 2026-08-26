import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * A blob store backed by the filesystem, for local development.
 *
 * `@netlify/blobs` only works inside Netlify's runtime, so without something
 * like this the only way to play a networked game on your own machine is to
 * run the full Netlify CLI. That CLI cannot be installed here — it and vitest
 * disagree about a shared dependency — and a 100MB tool is a lot to ask of
 * someone who wants to check that a lobby works.
 *
 * It implements only the handful of methods `storage.mts` actually calls, and
 * deliberately no more: notably it has no conditional write, because the real
 * one has none either. A local store that was *more* capable than production
 * would let a race pass here and fail on deploy.
 */
export interface FileStore {
  get(key: string, options?: { type?: string }): Promise<unknown>;
  getMetadata(key: string): Promise<{ etag: string | undefined; metadata: object } | null>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string }): Promise<{ blobs: Array<{ key: string; etag: string }> }>;
}

/** Keys contain slashes; the filesystem must not treat them as directories. */
const encode = (key: string) => encodeURIComponent(key);
const decode = (name: string) => decodeURIComponent(name);

export function createFileStore(directory: string): FileStore {
  const file = (key: string) => path.join(directory, encode(key));

  /** Cheap content hash, standing in for the real store's etag. */
  const etagOf = (value: string) => {
    let hash = 2166136261;
    for (let i = 0; i < value.length; i++) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16);
  };

  const read = async (key: string): Promise<string | null> => {
    try {
      return await readFile(file(key), "utf8");
    } catch {
      return null;
    }
  };

  return {
    async get(key, options) {
      const raw = await read(key);
      if (raw === null) return null;
      return options?.type === "json" ? JSON.parse(raw) : raw;
    },

    async getMetadata(key) {
      const raw = await read(key);
      if (raw === null) return null;
      return { etag: etagOf(raw), metadata: {} };
    },

    async set(key, value) {
      await mkdir(directory, { recursive: true });
      await writeFile(file(key), value);
    },

    async delete(key) {
      await rm(file(key), { force: true });
    },

    async list({ prefix = "" } = {}) {
      let names: string[];
      try {
        names = await readdir(directory);
      } catch {
        return { blobs: [] };
      }

      const blobs = [];
      for (const name of names) {
        const key = decode(name);
        if (!key.startsWith(prefix)) continue;
        const raw = await read(key);
        if (raw === null) continue;
        blobs.push({ key, etag: etagOf(raw) });
      }
      return { blobs };
    },
  };
}
