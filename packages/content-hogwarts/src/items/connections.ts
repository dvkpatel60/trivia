import type { ConnectionsItem } from "@curio/core";

/**
 * Sixteen tiles, four groups of four.
 *
 * The craft is in the overlaps: every puzzle below has at least one tile that
 * looks like it belongs to two groups, so the table has to find the
 * arrangement that resolves all four rather than the first thing they spot.
 * Lupin is a Marauder and a Defence teacher; Nagini is a snake and a
 * Horcrux; McGonagall is Head of Gryffindor and an Animagus.
 *
 * The hard rule is that every tile must genuinely belong to the group that
 * claims it. Several puzzles here used to be padded out to four with a tile
 * that did not — "Unforgivable" sat inside the Unforgivable Curses because
 * there are only three of them, "Peverell" counted as a Deathly Hallow,
 * "Golden" as a Quidditch ball, "Gringotts" as wizarding money. That is
 * worse than a thin puzzle: a player who knows there are exactly three
 * Unforgivable Curses is actively punished for knowing it. Where a category
 * has only three real members, the group is built from something else.
 */
export const connections: ConnectionsItem[] = [
  {
    groups: [
      { label: "Marauders", members: ["Moony", "Wormtail", "Padfoot", "Prongs"] },
      { label: "Horcruxes", members: ["Diary", "Locket", "Cup", "Diadem"] },
      { label: "Peverell brothers' legacy", members: ["Elder Wand", "Cloak", "Stone", "Tale of Three Brothers"] },
      { label: "Weasleys", members: ["Percy", "Charlie", "Bill", "Ginny"] },
    ],
  },
  {
    groups: [
      { label: "Hogwarts ghosts", members: ["Nearly Headless Nick", "Grey Lady", "Bloody Baron", "Fat Friar"] },
      { label: "Defence teachers", members: ["Quirrell", "Lockhart", "Umbridge", "Carrow"] },
      { label: "Quidditch", members: ["Quaffle", "Bludger", "Snitch", "Keeper"] },
      { label: "Hogsmeade spots", members: ["Three Broomsticks", "Hog's Head", "Zonko's", "Shrieking Shack"] },
    ],
  },
  {
    groups: [
      { label: "Animagi", members: ["Rita Skeeter", "McGonagall", "Sirius", "Peter"] },
      { label: "Mauled by Greyback", members: ["Lupin", "Bill Weasley", "Lavender Brown", "Montgomery"] },
      { label: "Snakes", members: ["Nagini", "Basilisk", "Boa constrictor", "Ashwinder"] },
      { label: "Owls", members: ["Hedwig", "Errol", "Pigwidgeon", "Hermes"] },
    ],
  },
  {
    groups: [
      { label: "Curses", members: ["Avada Kedavra", "Crucio", "Imperio", "Sectumsempra"] },
      { label: "Charms", members: ["Wingardium Leviosa", "Alohomora", "Lumos", "Accio"] },
      { label: "Potions", members: ["Felix Felicis", "Polyjuice", "Veritaserum", "Amortentia"] },
      { label: "Wand cores", members: ["Phoenix feather", "Dragon heartstring", "Unicorn hair", "Thestral tail hair"] },
    ],
  },
  {
    groups: [
      { label: "Beasts", members: ["Hippogriff", "Niffler", "Acromantula", "Grindylow"] },
      { label: "Plants", members: ["Mandrake", "Devil's Snare", "Gillyweed", "Bubotuber"] },
      { label: "Not quite alive", members: ["Boggart", "Dementor", "Inferius", "Peeves"] },
      { label: "Hagrid's", members: ["Fang", "Fluffy", "Norbert", "Buckbeak"] },
    ],
  },
  {
    groups: [
      { label: "Triwizard champions", members: ["Cedric", "Fleur", "Krum", "Harry"] },
      { label: "Wizarding schools", members: ["Beauxbatons", "Durmstrang", "Ilvermorny", "Mahoutokoro"] },
      { label: "Ministry departments", members: ["Mysteries", "Aurors", "Misuse of Muggle Artefacts", "Magical Games"] },
      { label: "At Gringotts", members: ["Galleon", "Sickle", "Knut", "Vault"] },
    ],
  },
  {
    groups: [
      { label: "Order of the Phoenix", members: ["Moody", "Tonks", "Kingsley", "Dedalus"] },
      { label: "Death Eaters", members: ["Bellatrix", "Lucius", "Dolohov", "Rookwood"] },
      { label: "Dumbledore's Army", members: ["Neville", "Luna", "Ginny", "Colin"] },
      { label: "Founders", members: ["Godric", "Salazar", "Rowena", "Helga"] },
    ],
  },
  {
    groups: [
      { label: "Rooms in the castle", members: ["Room of Requirement", "Trophy Room", "Astronomy Tower", "Great Hall"] },
      { label: "Down in the vaults", members: ["Cart", "Goblin", "Dragon", "Thief's Downfall"] },
      { label: "Shops in Diagon Alley", members: ["Ollivanders", "Flourish and Blotts", "Madam Malkin's", "Eeylops"] },
      { label: "Ways to travel", members: ["Floo Powder", "Portkey", "Apparition", "Knight Bus"] },
    ],
  },
  {
    groups: [
      { label: "Who destroyed a Horcrux", members: ["Harry", "Dumbledore", "Ron", "Crabbe"] },
      { label: "Died at the Battle of Hogwarts", members: ["Fred", "Remus", "Tonks", "Snape"] },
      { label: "Killed by Voldemort himself", members: ["James", "Lily", "Frank Bryce", "Charity Burbage"] },
      { label: "Survived to the epilogue", members: ["Neville", "Luna", "Draco", "Hagrid"] },
    ],
  },
  {
    groups: [
      { label: "Voldemort's family", members: ["Marvolo", "Morfin", "Merope", "Tom Riddle Sr"] },
      { label: "Black family", members: ["Regulus", "Bellatrix", "Andromeda", "Phineas Nigellus"] },
      { label: "Riddle's trophies", members: ["Hepzibah's cup", "Slytherin's locket", "Ravenclaw's diadem", "Marvolo's ring"] },
      { label: "Dumbledore family", members: ["Aberforth", "Ariana", "Kendra", "Percival"] },
    ],
  },
  {
    groups: [
      { label: "Guarding the Stone", members: ["Devil's Snare", "Winged keys", "Giant chess", "Mirror of Erised"] },
      { label: "Triwizard tasks", members: ["Dragon", "Black Lake", "Maze", "Golden egg"] },
      { label: "In the Department of Mysteries", members: ["The Veil", "Hall of Prophecy", "Time Room", "Brains"] },
      { label: "At Malfoy Manor", members: ["Griphook", "Ollivander", "Dobby", "Bellatrix's knife"] },
    ],
  },
  {
    groups: [
      { label: "Weasleys' Wizard Wheezes", members: ["Puking Pastilles", "Extendable Ears", "Skiving Snackbox", "Decoy Detonator"] },
      { label: "Hogsmeade shops", members: ["Zonko's", "Honeydukes", "Dervish and Banges", "Gladrags"] },
      { label: "Sweets", members: ["Chocolate Frog", "Bertie Bott's", "Fizzing Whizbee", "Acid Pop"] },
      { label: "Books on the school shelf", members: ["A History of Magic", "Fantastic Beasts", "Magical Me", "Advanced Potion-Making"] },
    ],
  },
  {
    groups: [
      { label: "Ministers for Magic", members: ["Fudge", "Scrimgeour", "Thicknesse", "Kingsley"] },
      { label: "Hogwarts headteachers", members: ["Dippet", "Dumbledore", "Umbridge", "Snape"] },
      { label: "Heads of house", members: ["McGonagall", "Sprout", "Flitwick", "Slughorn"] },
      { label: "Quidditch teams", members: ["Chudley Cannons", "Holyhead Harpies", "Puddlemere United", "Wimbourne Wasps"] },
    ],
  },
  {
    groups: [
      { label: "Wands that changed hands", members: ["Elder Wand", "Draco's hawthorn", "Bellatrix's walnut", "Neville's father's wand"] },
      { label: "Ways to spot a fraud", members: ["Veritaserum", "Sneakoscope", "Foe-Glass", "Revelio"] },
      { label: "Sirius left Harry", members: ["Grimmauld Place", "Kreacher", "Buckbeak", "Gold"] },
      { label: "Dumbledore's bequests", members: ["The first Snitch", "Sword of Gryffindor", "Deluminator", "Beedle the Bard"] },
    ],
  },
];
