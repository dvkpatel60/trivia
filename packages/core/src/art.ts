/**
 * Prompts for generated picture-round art.
 *
 * A picture round only works if every image in it looks like it came from the
 * same set. Left to itself, a text-to-image model will happily return an oil
 * painting, a 3D render and a photograph for three prompts written on three
 * different days.
 *
 * So the prompt is composed, not authored. An item supplies only its subject;
 * the pack supplies the art direction every one of its images shares; and this
 * module supplies the constraints that hold for every image in the app —
 * chief among them "no text", because a model that writes a word into a
 * picture can hand the player the answer.
 */

import type { MediaRef } from "./types.js";

export interface ArtDirection {
  /** Medium and treatment: "candlelit oil painting, chiaroscuro". */
  style: string;
  /** Colour guidance, so images sit inside the pack's own palette. */
  palette: string;
  /** Framing shared by every image in the pack. */
  composition: string;
  /** Extra things this pack in particular should avoid. */
  avoid?: string;
}

/** What an authored item contributes: an id, and what the picture shows. */
export interface GeneratedArt {
  /**
   * Stable identity. It names the file on disk and seeds the generator, so
   * regenerating a pack reproduces the same images rather than reshuffling
   * the whole set.
   */
  id: string;
  /** The subject, in plain words. No style, no camera, no colours. */
  subject: string;
}

/**
 * True of every image, in every pack.
 *
 * "No text" is not a stylistic preference: a caption baked into a
 * picture-round image can give away the answer, or contradict it.
 *
 * Note what is *not* asked for here — a size, a rounded corner, a consistent
 * background. A diffusion model honours none of those reliably, and it does
 * not need to: every picture is rendered inside a fixed frame that supplies
 * all three. Ask the model for the subject; let the app do the framing.
 */
export const UNIVERSAL_CONSTRAINTS = [
  "no text",
  "no lettering",
  "no words or numbers",
  "no watermark or signature",
  "no border or frame",
  "single subject, centred",
  "plain uncluttered background",
  /*
   * Every image is cropped to a fixed frame at render time, so anything
   * pressed against an edge loses its head. Asking for margin is one of the
   * few compositional things a model reliably obliges.
   */
  "subject fully within frame with even margin",
] as const;

/** For the models that accept one. Mirrors the constraints above. */
export const NEGATIVE_PROMPT = [
  "text, letters, words, numbers, caption, label",
  "watermark, signature, logo, ui, interface",
  "frame, border, collage, multiple panels, split screen",
  "blurry, low quality, distorted, deformed, extra limbs",
].join(", ");

/** The one shape every generated image is produced at. */
export const ART_SIZE = { width: 768, height: 512 } as const;

export function composePrompt(art: GeneratedArt, direction: ArtDirection): string {
  return [
    art.subject,
    direction.style,
    direction.palette,
    direction.composition,
    ...UNIVERSAL_CONSTRAINTS,
  ]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");
}

export function composeNegativePrompt(direction: ArtDirection): string {
  return direction.avoid ? `${NEGATIVE_PROMPT}, ${direction.avoid}` : NEGATIVE_PROMPT;
}

/**
 * A deterministic seed from an art id.
 *
 * Same id, same seed, same picture — so regenerating one item leaves the rest
 * of the pack untouched, and a reviewer comparing two runs is comparing the
 * prompt change rather than the dice.
 */
export function seedForArt(id: string): number {
  let hash = 2166136261;
  for (let i = 0; i < id.length; i++) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  // Cloudflare's models take a 32-bit unsigned seed.
  return hash >>> 0;
}

/** Where the generator writes an image, and where the app serves it from. */
export function artPath(packId: string, artId: string): string {
  return `/packs/${packId}/${artId}.png`;
}

/** The `MediaRef` an art-backed item should carry. */
export function artMedia(packId: string, art: GeneratedArt, alt: string): MediaRef {
  return {
    src: artPath(packId, art.id),
    alt,
    aspect: ART_SIZE.width / ART_SIZE.height,
  };
}
