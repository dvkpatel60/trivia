import type { TrueFalseItem } from "@candlelight/core";

/** A statement to accept or reject. `note` explains the trap on a miss. */
export const truefalse: TrueFalseItem[] = [
  { statement: "Hedwig is a snowy owl.", answer: true },
  { statement: "Peeves is a ghost.", answer: false, note: "He's a poltergeist — never alive to begin with." },
  { statement: "Argus Filch is a Squib.", answer: true },
  { statement: "Fawkes is a griffin.", answer: false, note: "Fawkes is a phoenix." },
  { statement: "Sirius Black is Harry's godfather.", answer: true },
  { statement: "Draco Malfoy was sorted into Ravenclaw.", answer: false, note: "Slytherin, and instantly." },
  { statement: "Moaning Myrtle haunts a girls' bathroom.", answer: true },
  { statement: "Hagrid was expelled from Hogwarts as a student.", answer: true },
  { statement: "Nagini is Voldemort's cat.", answer: false, note: "Nagini is a snake." },
  { statement: "Dementors guard Azkaban.", answer: true },
  { statement: "Firenze the centaur taught Divination.", answer: true },
  { statement: "The Knight Bus is triple-decker and purple.", answer: true },
  { statement: "Umbridge decorates her office with kitten plates.", answer: true },
  { statement: "Butterbeer is sold at the Three Broomsticks.", answer: true },
  { statement: "Viktor Krum attended Beauxbatons.", answer: false, note: "Durmstrang." },
  { statement: "Luna Lovegood is a Ravenclaw.", answer: true },
  { statement: "The Whomping Willow hides a passage to Hogsmeade.", answer: true },
  { statement: "Cho Chang played Beater for Ravenclaw.", answer: false, note: "She was a Seeker." },
  { statement: "Bill Weasley worked as a curse-breaker for Gringotts.", answer: true },
  { statement: "A Niffler is attracted to anything shiny.", answer: true },
  { statement: "Godric's Hollow is where Harry's parents died.", answer: true },
  { statement: "Slughorn was Head of Ravenclaw house.", answer: false, note: "Slytherin." },
];
