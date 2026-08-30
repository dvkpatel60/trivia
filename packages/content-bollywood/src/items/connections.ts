import type { ConnectionsItem } from "@curio/core";

/**
 * Sixteen tiles, four groups of four.
 *
 * The craft is in the overlaps: each puzzle has at least one tile that looks
 * like it belongs in two groups, so the table has to find the arrangement
 * that resolves all four rather than the first thing anyone spots. Rockstar
 * is a Ranbir film and an Imtiaz Ali film; Aamir Khan taught the boy in
 * Taare Zameen Par as well as starring in half the decade's hits; Bhaag
 * Milkha Bhaag is a sports film and a biopic at once.
 */
export const connections: ConnectionsItem[] = [
  {
    groups: [
      { label: "Rajkumar Hirani films", members: ["Munna Bhai", "3 Idiots", "PK", "Sanju"] },
      { label: "Vishal Bhardwaj films", members: ["Maqbool", "Omkara", "Haider", "Kaminey"] },
      { label: "Sports films", members: ["Dangal", "Sultan", "Iqbal", "Chak De"] },
      { label: "A place in the title", members: ["Wasseypur", "Bareilly Ki Barfi", "Chennai Express", "Delhi-6"] },
    ],
  },
  {
    groups: [
      { label: "Zoya Akhtar films", members: ["Luck by Chance", "Zindagi Na Milegi Dobara", "Dil Dhadakne Do", "Gully Boy"] },
      { label: "Imtiaz Ali films", members: ["Jab We Met", "Rockstar", "Highway", "Tamasha"] },
      { label: "Ranbir Kapoor films", members: ["Saawariya", "Barfi!", "Wake Up Sid", "Sanju"] },
      { label: "Launched somebody", members: ["Band Baaja Baaraat", "Student of the Year", "Vicky Donor", "Masaan"] },
    ],
  },
  {
    groups: [
      { label: "A. R. Rahman songs", members: ["Jai Ho", "Masakali", "Kun Faya Kun", "Barso Re"] },
      { label: "Item numbers", members: ["Munni Badnaam", "Sheila Ki Jawani", "Chikni Chameli", "Fevicol Se"] },
      { label: "Bhansali floor-shakers", members: ["Deewani Mastani", "Ghoomar", "Nagada Sang Dhol", "Dola Re"] },
      { label: "Sung by Arijit Singh", members: ["Tum Hi Ho", "Channa Mereya", "Zaalima", "Ae Dil Hai Mushkil"] },
    ],
  },
  {
    groups: [
      { label: "Policemen", members: ["Chulbul Pandey", "Bajirao Singham", "Sangram Bhalerao", "Ayan Ranjan"] },
      { label: "Teachers and coaches", members: ["Ram Shankar Nikumbh", "Debraj Sahai", "Anand Kumar", "Kabir Khan"] },
      { label: "Aamir Khan roles", members: ["Rancho", "DJ", "Sanjay Singhania", "Mahavir Singh Phogat"] },
      { label: "Villains", members: ["Alauddin Khilji", "Ramadhir Singh", "Kancha Cheena", "Ra.One"] },
    ],
  },
  {
    groups: [
      { label: "Released in 2001", members: ["Lagaan", "Dil Chahta Hai", "Gadar", "Kabhi Khushi Kabhie Gham"] },
      { label: "Released in 2007", members: ["Chak De! India", "Om Shanti Om", "Taare Zameen Par", "Jab We Met"] },
      { label: "Released in 2012", members: ["Gangs of Wasseypur", "Barfi!", "Kahaani", "Vicky Donor"] },
      { label: "Released in 2018", members: ["Andhadhun", "Padmaavat", "Raazi", "Badhaai Ho"] },
    ],
  },
  {
    groups: [
      { label: "Directors", members: ["Rajkumar Hirani", "Sanjay Leela Bhansali", "Anurag Kashyap", "Vikramaditya Motwane"] },
      { label: "Composers", members: ["A. R. Rahman", "Pritam", "Amit Trivedi", "Sneha Khanwalkar"] },
      { label: "Playback singers", members: ["Arijit Singh", "Shreya Ghoshal", "Sonu Nigam", "Sunidhi Chauhan"] },
      { label: "Lyricists", members: ["Gulzar", "Javed Akhtar", "Prasoon Joshi", "Irshad Kamil"] },
    ],
  },
  {
    groups: [
      { label: "Shah Rukh Khan", members: ["Swades", "Chak De! India", "Fan", "Raees"] },
      { label: "Salman Khan", members: ["Wanted", "Bodyguard", "Kick", "Tiger Zinda Hai"] },
      { label: "Aamir Khan", members: ["Ghajini", "Talaash", "PK", "Dangal"] },
      { label: "Akshay Kumar", members: ["Airlift", "Rustom", "Special 26", "Pad Man"] },
    ],
  },
  {
    groups: [
      { label: "Shakespeare, adapted", members: ["Maqbool", "Omkara", "Haider", "Ram-Leela"] },
      { label: "From a Chetan Bhagat novel", members: ["3 Idiots", "Kai Po Che!", "2 States", "Half Girlfriend"] },
      { label: "Remade from a southern hit", members: ["Ghajini", "Wanted", "Singham", "Kabir Singh"] },
      { label: "From real events", members: ["Uri", "Neerja", "Airlift", "Raazi"] },
    ],
  },
  {
    groups: [
      { label: "Biopics", members: ["Sanju", "Neerja", "Mary Kom", "Bhaag Milkha Bhaag"] },
      { label: "Sports films", members: ["Dangal", "Sultan", "Chak De! India", "Iqbal"] },
      { label: "Set at school or college", members: ["3 Idiots", "Student of the Year", "Taare Zameen Par", "Chhichhore"] },
      { label: "Set abroad", members: ["Queen", "English Vinglish", "Kal Ho Naa Ho", "Namastey London"] },
    ],
  },
  {
    groups: [
      { label: "Songs from Rockstar", members: ["Sadda Haq", "Nadaan Parindey", "Kun Faya Kun", "Tum Ho"] },
      { label: "Songs from 3 Idiots", members: ["Give Me Some Sunshine", "Zoobi Doobi", "Behti Hawa Sa Tha Woh", "All Izz Well"] },
      { label: "Songs from Om Shanti Om", members: ["Dard-E-Disco", "Deewangi Deewangi", "Aankhon Mein Teri", "Main Agar Kahoon"] },
      { label: "Songs from Gully Boy", members: ["Apna Time Aayega", "Mere Gully Mein", "Doori", "Azadi"] },
    ],
  },
  {
    groups: [
      { label: "Gangs of Wasseypur", members: ["Sardar Khan", "Faizal", "Ramadhir", "Definite"] },
      { label: "3 Idiots", members: ["Rancho", "Farhan", "Raju", "Virus"] },
      { label: "Andhadhun", members: ["Akash", "Simi", "Manohar", "Sophie"] },
      { label: "Dangal", members: ["Mahavir", "Geeta", "Babita", "Omkar"] },
    ],
  },
  {
    groups: [
      { label: "Scored by Shankar–Ehsaan–Loy", members: ["Dil Chahta Hai", "Kal Ho Naa Ho", "Rock On!!", "Taare Zameen Par"] },
      { label: "Scored by A. R. Rahman", members: ["Lagaan", "Rang De Basanti", "Guru", "Rockstar"] },
      { label: "Scored by Pritam", members: ["Jab We Met", "Barfi!", "Yeh Jawaani Hai Deewani", "Ae Dil Hai Mushkil"] },
      { label: "Scored by Amit Trivedi", members: ["Dev.D", "Udaan", "Queen", "Lootera"] },
    ],
  },
];
