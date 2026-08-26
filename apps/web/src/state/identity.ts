/**
 * Who this browser is.
 *
 * The only thing the app persists. There are no accounts: a player is a
 * random id kept in localStorage, which is enough to rejoin a game after a
 * refresh and nothing more.
 */

const KEY = "candlelight:me";

export interface Identity {
  id: string;
  name: string;
  /** The game they were last in, so a refresh drops them back into it. */
  code: string | null;
}

const newId = () => Math.random().toString(36).slice(2, 10);

export function loadIdentity(): Identity {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Identity>;
      if (parsed.id) {
        return { id: parsed.id, name: parsed.name ?? "", code: parsed.code ?? null };
      }
    }
  } catch {
    // Private browsing, disabled storage, corrupt value — start fresh.
  }
  return { id: newId(), name: "", code: null };
}

export function saveIdentity(identity: Identity): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(identity));
  } catch {
    // Not being able to remember them is survivable; the game still runs.
  }
}
