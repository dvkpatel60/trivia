import type { CategorySet } from "@curio/core";

/**
 * The ways this pack sorts things.
 *
 * A sorting question draws from one set at a time, so the buckets on screen
 * always belong together — release windows never appear beside crafts. The
 * engine knows nothing about playback singers; it only asks the pack.
 *
 * Every bucket here lives inside the pack's window, 2000 to 2019. A set that
 * spanned the whole century would put a 1950s answer beside a 2016 one and
 * make the sorting trivial; four five-year slices of the same two decades is
 * a real question.
 */
export const categorySets: CategorySet[] = [
  {
    id: "era",
    prompt: "When did it come out?",
    categories: [
      { id: "early2000s", label: "2000–2004", sub: "Before the multiplex", color: "#8aa1c9" },
      { id: "late2000s", label: "2005–2009", sub: "The 100-crore club", color: "#e0653f" },
      { id: "early2010s", label: "2010–2014", sub: "Small films, big money", color: "#e8a33d" },
      { id: "late2010s", label: "2015–2019", sub: "Biopics and streaming", color: "#3fa088" },
    ],
  },
  {
    id: "craft",
    prompt: "What are they known for?",
    categories: [
      { id: "acting", label: "Acting", sub: "In front of it", color: "#e0653f" },
      { id: "directing", label: "Directing", sub: "Behind it", color: "#8b6ad4" },
      { id: "singing", label: "Playback", sub: "The voice", color: "#e8a33d" },
      { id: "composing", label: "Music", sub: "The score", color: "#3fa088" },
    ],
  },
  {
    id: "stars",
    prompt: "Whose film is it?",
    categories: [
      { id: "shahrukh", label: "Shah Rukh Khan", sub: "The romantic", color: "#e0653f" },
      { id: "salman", label: "Salman Khan", sub: "The Eid release", color: "#3fa088" },
      { id: "aamir", label: "Aamir Khan", sub: "One film at a time", color: "#8b6ad4" },
      { id: "akshay", label: "Akshay Kumar", sub: "Three a year", color: "#e8a33d" },
    ],
  },
  {
    id: "settings",
    prompt: "Where does it take place?",
    categories: [
      { id: "mumbai", label: "Mumbai", sub: "The city itself", color: "#e0653f" },
      { id: "delhi", label: "Delhi", sub: "Punjabi weddings, Old City", color: "#e8a33d" },
      { id: "abroad", label: "Abroad", sub: "Passport required", color: "#8b6ad4" },
      { id: "smalltown", label: "Small-town India", sub: "Everywhere else", color: "#3fa088" },
    ],
  },
];
