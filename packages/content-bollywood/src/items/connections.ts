import type { ConnectionsItem } from "@curio/core";

/**
 * Sixteen tiles, four groups of four.
 *
 * The craft is in the overlaps: each puzzle has at least one tile that looks
 * like it belongs in two groups, so the table has to find the arrangement
 * that resolves all four rather than the first thing anyone spots. Kishore
 * acted as well as sang; Aamir directs as well as stars; Kapoor is a family
 * and a surname three different careers share.
 */
export const connections: ConnectionsItem[] = [
  {
    groups: [
      { label: "The Khans", members: ["Shah Rukh", "Salman", "Aamir", "Saif"] },
      { label: "Sholay characters", members: ["Jai", "Veeru", "Basanti", "Gabbar"] },
      { label: "Playback singers", members: ["Rafi", "Kishore", "Mukesh", "Lata"] },
      { label: "Yash Raj films", members: ["Darr", "Veer-Zaara", "Dhoom", "Sultan"] },
    ],
  },
  {
    groups: [
      { label: "Rajkumar Hirani films", members: ["Munna Bhai", "3 Idiots", "PK", "Sanju"] },
      { label: "Shakespeare, via Bhardwaj", members: ["Maqbool", "Omkara", "Haider", "Kaminey"] },
      { label: "Sports films", members: ["Dangal", "Sultan", "Iqbal", "Chak De"] },
      { label: "Towns in a title", members: ["Wasseypur", "Bareilly", "Udta Punjab", "Bombay"] },
    ],
  },
  {
    groups: [
      { label: "Kapoors", members: ["Prithviraj", "Raj", "Rishi", "Ranbir"] },
      { label: "Bachchans", members: ["Harivansh", "Amitabh", "Jaya", "Abhishek"] },
      { label: "Composers", members: ["Naushad", "Pancham", "Rahman", "Madan Mohan"] },
      { label: "Lyricists", members: ["Gulzar", "Sahir", "Shailendra", "Javed"] },
    ],
  },
  {
    groups: [
      { label: "Amitabh in the 1970s", members: ["Deewaar", "Zanjeer", "Trishul", "Kaala Patthar"] },
      { label: "Guru Dutt", members: ["Pyaasa", "Kaagaz Ke Phool", "Baazi", "Sahib Bibi"] },
      { label: "Raj Kapoor", members: ["Awara", "Shree 420", "Barsaat", "Sangam"] },
      { label: "Bimal Roy", members: ["Madhumati", "Devdas", "Bandini", "Sujata"] },
    ],
  },
  {
    groups: [
      { label: "Wedding rituals", members: ["Sangeet", "Mehndi", "Baraat", "Vidaai"] },
      { label: "Instruments", members: ["Tabla", "Sitar", "Dholak", "Shehnai"] },
      { label: "Song forms", members: ["Qawwali", "Ghazal", "Bhajan", "Thumri"] },
      { label: "Dance styles", members: ["Kathak", "Bharatanatyam", "Bhangra", "Garba"] },
    ],
  },
  {
    groups: [
      { label: "Directing debuts", members: ["Dil Chahta Hai", "Masaan", "Newton", "Band Baaja Baaraat"] },
      { label: "Set abroad", members: ["Spain", "Amsterdam", "Durban", "London"] },
      { label: "Bhansali films", members: ["Devdas", "Bajirao", "Padmaavat", "Black"] },
      { label: "Aamir directed or starred", members: ["Lagaan", "Taare Zameen Par", "Ghajini", "Talaash"] },
    ],
  },
  {
    groups: [
      { label: "Villains", members: ["Gabbar", "Mogambo", "Shakaal", "Kancha"] },
      { label: "Anti-heroes", members: ["Vijay", "Devdas", "Don", "Kabir"] },
      { label: "Comic characters", members: ["Circuit", "Baburao", "Gogo", "Teja"] },
      { label: "Heroines by name", members: ["Geet", "Paro", "Simran", "Anjali"] },
    ],
  },
  {
    groups: [
      { label: "Biopics", members: ["Neerja", "Mary Kom", "Milkha", "Sanju"] },
      { label: "Remakes", members: ["Drishyam", "Hera Pheri", "Kabir Singh", "Ghajini"] },
      { label: "Franchises", members: ["Dhoom", "Golmaal", "Krrish", "Race"] },
      { label: "Oscar entries", members: ["Lagaan", "Devdas", "Newton", "Jallikattu"] },
    ],
  },
  {
    groups: [
      { label: "Production houses", members: ["Dharma", "Yash Raj", "Rajshri", "Excel"] },
      { label: "Awards", members: ["Filmfare", "National", "IIFA", "Screen"] },
      { label: "Mumbai cinemas", members: ["Maratha Mandir", "Regal", "Liberty", "Eros"] },
      { label: "Industries", members: ["Kollywood", "Tollywood", "Mollywood", "Sandalwood"] },
    ],
  },
  {
    groups: [
      { label: "Songs about rain", members: ["Barsaat", "Rimjhim", "Bhaage Re", "Tip Tip"] },
      { label: "Songs about the road", members: ["Chaiyya Chaiyya", "Safarnama", "Musafir", "Yun Hi Chala"] },
      { label: "Songs about home", members: ["Yeh Jo Des", "Ae Watan", "Chak De", "Maa"] },
      { label: "Songs about longing", members: ["Kabira", "Tum Hi Ho", "Agar Tum Saath Ho", "Channa Mereya"] },
    ],
  },
  {
    groups: [
      { label: "Actresses of the 1950s", members: ["Nargis", "Madhubala", "Meena Kumari", "Nutan"] },
      { label: "Actresses of the 1990s", members: ["Madhuri", "Juhi", "Karisma", "Kajol"] },
      { label: "Actresses now", members: ["Alia", "Deepika", "Kangana", "Taapsee"] },
      { label: "Parallel cinema", members: ["Shabana", "Smita", "Deepti", "Supriya"] },
    ],
  },
  {
    groups: [
      { label: "Imtiaz Ali", members: ["Jab We Met", "Rockstar", "Tamasha", "Highway"] },
      { label: "Anurag Kashyap", members: ["Black Friday", "Dev.D", "Ugly", "Gulaal"] },
      { label: "Zoya Akhtar", members: ["Luck By Chance", "ZNMD", "Dil Dhadakne Do", "Gully Boy"] },
      { label: "Karan Johar", members: ["Kuch Kuch Hota Hai", "K3G", "Kal Ho Naa Ho", "My Name Is Khan"] },
    ],
  },
];
