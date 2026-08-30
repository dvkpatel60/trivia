import type { SequenceItem } from "@curio/core";

/**
 * Authored in the correct order; the engine shuffles before serving.
 *
 * There used to be two Defence-teacher orderings in here — one running
 * Quirrell to Umbridge, the other Quirrell to Snape with Moody quietly
 * dropped. Two questions about the same list, disagreeing with each other,
 * is worse than one: whichever a player learnt first, the other marks them
 * wrong. There is one now, and it runs the full seven years.
 */
export const sequence: SequenceItem[] = [
  {
    title: "Order the Triwizard tasks",
    items: [
      "Retrieve a golden egg from a dragon",
      "Rescue a hostage from the Black Lake",
      "Reach the cup at the heart of the maze",
    ],
  },
  {
    title: "Order these Horcruxes by when they were destroyed",
    items: [
      "Tom Riddle's diary",
      "Marvolo's ring",
      "Slytherin's locket",
      "Hufflepuff's cup",
      "Ravenclaw's diadem",
      "Nagini",
    ],
  },
  {
    title: "Order the wizarding coins, smallest value first",
    items: ["Knut", "Sickle", "Galleon"],
  },
  {
    title: "Order Harry's Defence Against the Dark Arts teachers, first year to seventh",
    items: [
      "Quirinus Quirrell",
      "Gilderoy Lockhart",
      "Remus Lupin",
      "'Alastor Moody'",
      "Dolores Umbridge",
      "Severus Snape",
      "Amycus Carrow",
    ],
  },
  {
    title: "Order these events in Harry's first year",
    items: [
      "A letter arrives by owl",
      "A visit to Ollivanders",
      "The Sorting Hat's decision",
      "Facing the mirror in the chamber below",
    ],
  },
  {
    title: "Order Harry's brooms, earliest first",
    items: ["School broom", "Nimbus 2000", "Firebolt"],
  },
  {
    title: "Order these by size, smallest first",
    items: ["A Snitch", "A Bludger", "A Quaffle"],
  },
  {
    title: "Order the stages of the Second Wizarding War",
    items: [
      "Voldemort returns in a graveyard",
      "The Ministry denies everything",
      "Dumbledore falls from the tower",
      "The Battle of Hogwarts",
    ],
  },
  {
    title: "Order what the three brothers asked for",
    items: ["An unbeatable wand", "A stone to recall the dead", "A cloak to hide from Death"],
  },
  {
    title: "Order these creatures by size, smallest first",
    items: ["Pixie", "Niffler", "Hippogriff", "Giant"],
  },
  {
    title: "Order these by when Harry first met them",
    items: ["Rubeus Hagrid", "Draco Malfoy", "Ron Weasley", "Hermione Granger"],
  },
  {
    title: "Order the castle from the ground up",
    items: ["The Chamber of Secrets", "The Dungeons", "The Great Hall", "The Astronomy Tower"],
  },
  {
    title: "Order the steps of facing a Boggart",
    items: ["It takes the shape of your fear", "You picture it absurd", "You cast Riddikulus", "Everybody laughs"],
  },

  /* ── for the ones who read the books twice ── */
  {
    title: "Order the Ministers for Magic, earliest first",
    items: ["Cornelius Fudge", "Rufus Scrimgeour", "Pius Thicknesse", "Kingsley Shacklebolt"],
  },
  {
    title: "Order the obstacles guarding the Philosopher's Stone",
    items: [
      "Fluffy, and the trapdoor",
      "Devil's Snare",
      "The winged keys",
      "The giant chess set",
      "The potions riddle",
      "The Mirror of Erised",
    ],
  },
  {
    title: "Order the Elder Wand's owners, earliest first",
    items: ["Gregorovitch", "Gellert Grindelwald", "Albus Dumbledore", "Draco Malfoy", "Harry Potter"],
  },
  {
    title: "Order these events of the night Voldemort fell, earliest first",
    items: [
      "The Fidelius Charm is cast on the Potters",
      "Pettigrew tells Voldemort where they are",
      "James dies at the foot of the stairs",
      "The curse rebounds on Voldemort",
      "Hagrid brings Harry to Privet Drive",
    ],
  },
  {
    title: "Order Harry's years at Hogwarts by what he faced",
    items: [
      "A man with two faces",
      "A monster in the pipes",
      "An innocent man in Azkaban",
      "A tournament he never entered",
      "A Ministry that called him a liar",
      "A tower, and a fake locket",
    ],
  },
  {
    title: "Order the Deathly Hallows as the three brothers received them",
    items: ["The Elder Wand", "The Resurrection Stone", "The Cloak of Invisibility"],
  },
  {
    title: "Order these Weasley children, eldest first",
    items: ["Bill", "Charlie", "Percy", "Fred and George", "Ron", "Ginny"],
  },
  {
    title: "Order the hunt for the locket, earliest first",
    items: [
      "Regulus swaps it for a fake and dies",
      "Kreacher hides it at Grimmauld Place",
      "Mundungus steals it",
      "Umbridge wears it at the Ministry",
      "Ron destroys it with the sword",
    ],
  },
  {
    title: "Order these by when Harry learnt them",
    items: [
      "Expelliarmus",
      "Expecto Patronum",
      "The Summoning Charm, for a dragon",
      "Sectumsempra",
    ],
  },
  {
    title: "Order the break-in at Gringotts",
    items: [
      "Polyjuice as Bellatrix",
      "The Thief's Downfall",
      "The vault fills with burning copies",
      "Out on the back of a dragon",
    ],
  },
  {
    title: "Order the Battle of Hogwarts",
    items: [
      "Aberforth opens the passage",
      "The school is evacuated",
      "The statues are woken to fight",
      "Harry walks into the forest",
      "Neville kills the snake",
    ],
  },
];
