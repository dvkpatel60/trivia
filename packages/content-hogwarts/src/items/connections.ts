import type { ConnectionsItem } from "@curio/core";

/**
 * Sixteen tiles, four groups of four.
 *
 * The craft is in the overlaps: every puzzle below has at least one tile that
 * looks like it belongs to two groups, so the table has to find the
 * arrangement that resolves all four rather than the first thing they spot.
 * Fawkes is a bird and a Hogwarts resident; Nagini is a snake and a Horcrux;
 * Sirius is a Marauder and an Animagus.
 */
export const connections: ConnectionsItem[] = [
  {
    groups: [
      { label: "Marauders", members: ["Moony", "Wormtail", "Padfoot", "Prongs"] },
      { label: "Horcruxes", members: ["Diary", "Locket", "Cup", "Diadem"] },
      { label: "Deathly Hallows", members: ["Elder Wand", "Cloak", "Stone", "Peverell"] },
      { label: "Weasleys", members: ["Percy", "Charlie", "Bill", "Ginny"] },
    ],
  },
  {
    groups: [
      { label: "Hogwarts ghosts", members: ["Nearly Headless Nick", "Grey Lady", "Bloody Baron", "Fat Friar"] },
      { label: "Defence teachers", members: ["Quirrell", "Lockhart", "Lupin", "Umbridge"] },
      { label: "Quidditch balls", members: ["Quaffle", "Bludger", "Snitch", "Golden"] },
      { label: "Hogsmeade spots", members: ["Three Broomsticks", "Hog's Head", "Zonko's", "Shrieking Shack"] },
    ],
  },
  {
    groups: [
      { label: "Animagi", members: ["Rita Skeeter", "McGonagall", "Sirius", "Peter"] },
      { label: "Werewolves", members: ["Lupin", "Greyback", "Bill Weasley", "Lavender"] },
      { label: "Snakes", members: ["Nagini", "Basilisk", "Slytherin", "Parselmouth"] },
      { label: "Owls", members: ["Hedwig", "Errol", "Pigwidgeon", "Hermes"] },
    ],
  },
  {
    groups: [
      { label: "Unforgivable", members: ["Avada Kedavra", "Crucio", "Imperio", "Unforgivable"] },
      { label: "Charms", members: ["Wingardium Leviosa", "Alohomora", "Lumos", "Accio"] },
      { label: "Potions", members: ["Felix Felicis", "Polyjuice", "Veritaserum", "Amortentia"] },
      { label: "Wand cores", members: ["Phoenix feather", "Dragon heartstring", "Unicorn hair", "Thestral"] },
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
      { label: "Wizarding money", members: ["Galleon", "Sickle", "Knut", "Gringotts"] },
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
      { label: "Hogwarts staircases and rooms", members: ["Room of Requirement", "Trophy Room", "Astronomy Tower", "Great Hall"] },
      { label: "Things in Gringotts", members: ["Vault", "Cart", "Goblin", "Dragon"] },
      { label: "Shops in Diagon Alley", members: ["Ollivanders", "Flourish and Blotts", "Madam Malkin's", "Eeylops"] },
      { label: "Ways to travel", members: ["Floo Powder", "Portkey", "Apparition", "Knight Bus"] },
    ],
  },
];
