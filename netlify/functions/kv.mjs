// Shared key-value store for Deep's Dueling Dragons.
// Four operations, backed by Netlify Blobs. No database to set up.
//
// This file lives at:   netlify/functions/kv.mjs
// The game calls it at: /.netlify/functions/kv
//
// Netlify maps every file in the functions directory (see netlify.toml)
// to /.netlify/functions/<filename>, so the path above is what makes
// cross-device play work. Move this file and invites stop reaching anyone.

import { getStore } from "@netlify/blobs";

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

export default async (req) => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Body must be JSON" }, 400);
  }

  const { op, key, value, prefix, shared } = body;

  // Personal data never reaches the server — the browser keeps that itself.
  if (shared === false) return json({ error: "Personal scope is client-side only" }, 400);

  // Store name is the original one on purpose: renaming it would orphan
  // every game already in flight.
  const store = getStore("candlelight");

  try {
    switch (op) {
      case "get": {
        if (!key) return json({ error: "key required" }, 400);
        const value = await store.get(key);          // null when absent
        return json({ key, value: value ?? null });
      }
      case "set": {
        if (!key || typeof value !== "string") return json({ error: "key and string value required" }, 400);
        if (value.length > 2_000_000) return json({ error: "value too large" }, 413);
        await store.set(key, value);
        return json({ key, ok: true });
      }
      case "del": {
        if (!key) return json({ error: "key required" }, 400);
        await store.delete(key);
        return json({ key, deleted: true });
      }
      case "list": {
        const { blobs } = await store.list({ prefix: prefix || "" });
        return json({ keys: blobs.map((b) => b.key) });
      }
      default:
        return json({ error: "op must be get, set, del or list" }, 400);
    }
  } catch (e) {
    return json({ error: String(e?.message || e) }, 500);
  }
};
