import type { TrueFalseItem } from "@candlelight/core";

export const truefalse: TrueFalseItem[] = [
  { statement: "Australia is both a country and a continent.", answer: true },
  { statement: "Istanbul sits on two continents.", answer: true },
  { statement: "Mount Kilimanjaro is in Kenya.", answer: false, note: "It's in Tanzania, near the Kenyan border." },
  { statement: "The Sahara is larger than Antarctica.", answer: false, note: "Antarctica is about half again as large." },
  { statement: "Canada has the longest coastline of any country.", answer: true },
  { statement: "The Nile flows north.", answer: true },
  { statement: "Reykjavik is the world's northernmost national capital.", answer: true },
  { statement: "Bolivia has a coastline.", answer: false, note: "Landlocked since 1884." },
  { statement: "The Amazon rainforest lies mostly in Brazil.", answer: true },
  { statement: "Greenland is a country.", answer: false, note: "It's an autonomous territory of Denmark." },
];
