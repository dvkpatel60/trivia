import type { Atmosphere } from "@curio/core";

/**
 * What the app wears when no topic has been chosen.
 *
 * The shell used to fall through to whichever pack `resolvePack(undefined)`
 * happened to return, which meant the front door was Hogwarts: you arrived
 * in a topic's world before you had picked one, and choosing Harry Potter
 * changed nothing at all.
 *
 * So the app has an identity of its own, and it is deliberately the opposite
 * of every pack — the only `bright` mood in the codebase. A near-white page
 * with confetti falling through it reads as a party game; stepping into a
 * topic is then a change of world rather than a change of accent, which is
 * the whole argument for packs declaring an atmosphere in the first place.
 *
 * It is not a `ContentPack`: it has no questions and never appears in the
 * picker. `applyPack` takes the shape both share.
 */
export const HOUSE: { id: string; atmosphere: Atmosphere } = {
  id: "curio",
  atmosphere: {
    /* A violet base, so the near-white page is warm rather than clinical. */
    hue: 292,
    mood: "bright",
    signature: {
      accent: "#7b3fe4",
      support: "#12a594",
      warn: "#e5484d",
      extra: "#f7a325",
    },
    /* No vignette: on a light ground it lightens the edge into nothing. */
    texture: [],
    scenery: ["confetti"],
    display: "fraunces",
  },
};
