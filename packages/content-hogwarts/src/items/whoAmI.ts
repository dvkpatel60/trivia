import type { WhoAmIItem } from "@curio/core";

/** Clues run vague to obvious; guessing early is worth more. */
export const whoAmI: WhoAmIItem[] = [
  {
    clues: [
      "I was a half-blood, and I was bullied at school.",
      "I taught Potions long before I taught anything else.",
      "My Patronus was a doe.",
    ],
    options: ["Severus Snape", "Horace Slughorn", "Regulus Black", "Barty Crouch Jr"],
    answer: 0,
  },
  {
    clues: [
      "I was clumsy, and nobody expected much of me.",
      "My grandmother raised me and never let me forget my parents.",
      "I killed the last Horcrux with a sword.",
    ],
    options: ["Seamus Finnigan", "Neville Longbottom", "Dean Thomas", "Colin Creevey"],
    answer: 1,
  },
  {
    clues: [
      "I served a cruel family for years.",
      "A single sock changed my life.",
      "I died protecting children I chose to help.",
    ],
    options: ["Kreacher", "Winky", "Dobby", "Hokey"],
    answer: 2,
  },
  {
    clues: [
      "I was a champion nobody resented.",
      "I played Seeker for my house.",
      "I died in a graveyard, first.",
    ],
    options: ["Cedric Diggory", "Viktor Krum", "Roger Davies", "Ernie Macmillan"],
    answer: 0,
  },
  {
    clues: [
      "I can change my appearance at will.",
      "I trained as an Auror.",
      "I married a man who thought he was too dangerous to love.",
    ],
    options: ["Emmeline Vance", "Hestia Jones", "Nymphadora Tonks", "Alice Longbottom"],
    answer: 2,
  },
  {
    clues: [
      "I was Head Girl in my year.",
      "I had red hair and green eyes.",
      "My death left a protection nobody could break.",
    ],
    options: ["Molly Weasley", "Lily Potter", "Marlene McKinnon", "Mary Macdonald"],
    answer: 1,
  },
  {
    clues: [
      "I spent twelve years somewhere very cold.",
      "I am an unregistered Animagus.",
      "I am the closest thing Harry had to a father.",
    ],
    options: ["Remus Lupin", "Alastor Moody", "Sirius Black", "Kingsley Shacklebolt"],
    answer: 2,
  },
  {
    clues: [
      "I run a shop built on laughter.",
      "I had an identical twin.",
      "I lost an ear and made a joke about it.",
    ],
    options: ["Fred Weasley", "George Weasley", "Lee Jordan", "Percy Weasley"],
    answer: 1,
  },
  {
    clues: [
      "I am a ghost, and the daughter of a founder.",
      "I stole from my mother and regretted it forever.",
      "My diadem became something monstrous.",
    ],
    options: ["The Fat Friar", "Helena Ravenclaw", "Moaning Myrtle", "The Bloody Baron"],
    answer: 1,
  },
  {
    clues: [
      "People called me odd and I never minded.",
      "I believe in creatures most wizards deny.",
      "My father printed a paper nobody trusted.",
    ],
    options: ["Luna Lovegood", "Padma Patil", "Susan Bones", "Hannah Abbott"],
    answer: 0,
  },
  {
    clues: [
      "I was once the most feared wizard in Europe.",
      "A childhood friend eventually defeated me.",
      "I died in a prison I built myself.",
    ],
    options: ["Voldemort", "Gellert Grindelwald", "Herpo the Foul", "Ekrizdis"],
    answer: 1,
  },
];
