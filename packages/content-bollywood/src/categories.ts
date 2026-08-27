import type { CategorySet } from "@curio/core";

/**
 * The ways this pack sorts things.
 *
 * A sorting question draws from one set at a time, so the buckets on screen
 * always belong together — decades never appear beside crafts. The engine
 * knows nothing about playback singers; it only asks the pack.
 */
export const categorySets: CategorySet[] = [
  {
    id: "decades",
    prompt: "Which decade did it come out?",
    categories: [
      { id: "sixties", label: "1950s–60s", sub: "Black and white", color: "#8aa1c9" },
      { id: "seventies", label: "1970s–80s", sub: "The angry years", color: "#e0653f" },
      { id: "nineties", label: "1990s", sub: "Chiffon and NRIs", color: "#e8a33d" },
      { id: "modern", label: "2000s on", sub: "Multiplex era", color: "#3fa088" },
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
    id: "settings",
    prompt: "Where does it take place?",
    categories: [
      { id: "mumbai", label: "Mumbai", sub: "The city itself", color: "#e0653f" },
      { id: "punjab", label: "Punjab & north", sub: "Fields and weddings", color: "#e8a33d" },
      { id: "abroad", label: "Abroad", sub: "Passport required", color: "#8b6ad4" },
      { id: "smalltown", label: "Small-town India", sub: "Everywhere else", color: "#3fa088" },
    ],
  },
  {
    id: "families",
    prompt: "Which film family?",
    categories: [
      { id: "kapoor", label: "Kapoor", sub: "The first dynasty", color: "#e0653f" },
      { id: "bachchan", label: "Bachchan", sub: "Of Allahabad", color: "#8b6ad4" },
      { id: "khan", label: "Khan", sub: "Salim's line", color: "#3fa088" },
      { id: "chopra", label: "Chopra & Johar", sub: "The studio families", color: "#e8a33d" },
    ],
  },
];
