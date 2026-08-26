import { getKind, KIND_IDS } from "./kinds/index.js";
import type { ContentPack, ItemFor, PuzzleKindId } from "./types.js";

/** Items an author has not retired. */
export function livingItems<K extends PuzzleKindId>(
  pack: ContentPack,
  kindId: K,
): Array<ItemFor[K]> {
  const items = (pack.items[kindId] ?? []) as Array<ItemFor[K]>;
  return items.filter((item) => !(item as { retired?: boolean }).retired);
}

/**
 * Kinds this pack can actually deal.
 *
 * A kind is available when some *drawable group* has enough live items — not
 * merely when the kind has enough overall. A pack with two sorting items in
 * each of three sets has plenty of items and cannot deal a single question.
 */
export function availableKinds(pack: ContentPack): PuzzleKindId[] {
  return KIND_IDS.filter((id) => {
    const kind = getKind(id);
    const items = livingItems(pack, id);
    if (items.length < kind.itemsPerQuestion) return false;

    if (!kind.groupKey) return true;

    const sizes = new Map<string, number>();
    for (const item of items) {
      const key = kind.groupKey(item as never);
      sizes.set(key, (sizes.get(key) ?? 0) + 1);
    }
    return [...sizes.values()].some((size) => size >= kind.itemsPerQuestion);
  });
}

export interface PackProblem {
  kind?: PuzzleKindId;
  message: string;
}

/**
 * Content authors get this instead of a runtime explosion mid-game. Run it in
 * a test over every pack and bad content never ships.
 */
export function validatePack(pack: ContentPack): PackProblem[] {
  const problems: PackProblem[] = [];
  const push = (message: string, kind?: PuzzleKindId) =>
    problems.push(kind ? { kind, message } : { message });

  if (!pack.id.trim()) push("Pack has no id.");
  if (!pack.name.trim()) push("Pack has no name.");

  const sets = pack.categorySets ?? [];
  const setIds = new Set(sets.map((set) => set.id));
  const categoryIdsBySet = new Map(
    sets.map((set) => [set.id, new Set(set.categories.map((category) => category.id))]),
  );

  for (const set of sets) {
    if (set.categories.length < 2) push(`category set "${set.id}" has fewer than two categories`);
    if (!set.prompt.trim()) push(`category set "${set.id}" has no prompt`);
  }

  for (const kindId of KIND_IDS) {
    const kind = getKind(kindId);
    const items = livingItems(pack, kindId);
    if (items.length === 0) continue;

    if (items.length < kind.itemsPerQuestion) {
      push(
        `has ${items.length} live ${kindId} ${items.length === 1 ? "item" : "items"} but a question needs ${kind.itemsPerQuestion}`,
        kindId,
      );
    }

    if (kind.needsCategories && setIds.size === 0) {
      push(`ships ${kindId} items but the pack declares no category sets`, kindId);
    }

    if (kindId === "categorize") {
      const perSet = new Map<string, number>();
      for (const item of items as Array<ItemFor["categorize"]>) {
        perSet.set(item.set, (perSet.get(item.set) ?? 0) + 1);
        if (!setIds.has(item.set)) {
          push(`"${item.label}" belongs to unknown set "${item.set}"`, kindId);
          continue;
        }
        if (!categoryIdsBySet.get(item.set)?.has(item.category)) {
          push(
            `"${item.label}" is filed under "${item.category}", which set "${item.set}" does not declare`,
            kindId,
          );
        }
      }
      // A set nobody can draw a full question from is dead content.
      for (const [setId, count] of perSet) {
        if (setIds.has(setId) && count < kind.itemsPerQuestion) {
          push(
            `set "${setId}" has ${count} live ${count === 1 ? "item" : "items"} but a question needs ${kind.itemsPerQuestion}`,
            kindId,
          );
        }
      }
    }

    if (kindId === "connections") {
      for (const item of items as Array<ItemFor["connections"]>) {
        const sizes = new Set(item.groups.map((group) => group.members.length));
        const first = item.groups[0];
        if (item.groups.length < 3) {
          push(`a connections puzzle has only ${item.groups.length} groups`, kindId);
        }
        if (sizes.size > 1) {
          push(`"${first?.label ?? "a puzzle"}" has groups of differing sizes`, kindId);
        }
        const members = item.groups.flatMap((group) => group.members);
        if (new Set(members).size !== members.length) {
          push(`"${first?.label ?? "a puzzle"}" repeats a tile between groups`, kindId);
        }
      }
    }

    if (kindId === "choice" || kindId === "imageChoice" || kindId === "whoAmI") {
      for (const item of items as Array<{ options: string[]; answer: number }>) {
        if (item.answer < 0 || item.answer >= item.options.length) {
          push(`an item has answer index ${item.answer} but ${item.options.length} options`, kindId);
        }
      }
    }

    if (kindId === "oddOneOut") {
      for (const item of items as Array<ItemFor["oddOneOut"]>) {
        if (item.answer < 0 || item.answer >= item.items.length) {
          push(`an item has answer index ${item.answer} but ${item.items.length} entries`, kindId);
        }
      }
    }

    if (kindId === "sequence") {
      for (const item of items as Array<ItemFor["sequence"]>) {
        if (item.items.length < 3) push(`"${item.title}" has fewer than 3 steps`, kindId);
      }
    }

    if (kindId === "whoAmI") {
      for (const item of items as Array<ItemFor["whoAmI"]>) {
        if (item.clues.length < 3) push(`an item has ${item.clues.length} clues, needs 3`, kindId);
      }
    }

    if (kindId === "imageChoice") {
      for (const item of items as Array<ItemFor["imageChoice"]>) {
        if (!item.media?.src) push(`"${item.prompt}" has no media source`, kindId);
        if (!item.media?.alt?.trim()) push(`"${item.prompt}" has no alt text`, kindId);
      }
    }
  }

  return problems;
}
