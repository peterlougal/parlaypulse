"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

/**
 * MANUAL UPDATE ZONE — edit scores/thru/status here every ~30 min.
 */
const TOURNAMENT = {
  name: "PGA Tour — Current Event",
  course: "Round 1 in progress",
  round: "Round 1",
  lastUpdated: "Aug 6, 2026 — manual pull",
};

type Player = {
  id: string;
  name: string;
  score: string;
  thru: string;
  status?: "playing" | "finished" | "teeing" | "wd" | "cut";
};

type Group = {
  id: string;
  label: string;
  teeTime?: string;
  players: Player[];
};

const GROUPS: Group[] = [
  // Morning wave — round complete
  {
    id: "g-550-1",
    label: "5:50 AM · Tee 1",
    teeTime: "5:50 AM",
    players: [
      { id: "eckroat", name: "Austin Eckroat", score: "-3", thru: "F", status: "finished" },
      { id: "schmid", name: "Matti Schmid", score: "-6", thru: "F", status: "finished" },
      { id: "jsmith", name: "Jordan Smith", score: "-5", thru: "F", status: "finished" },
    ],
  },
  {
    id: "g-550-10",
    label: "5:50 AM · Tee 10",
    teeTime: "5:50 AM",
    players: [
      { id: "smotherman", name: "Austin Smotherman", score: "-4", thru: "F", status: "finished" },
      { id: "olesen", name: "Thorbjørn Olesen", score: "-1", thru: "F", status: "finished" },
      { id: "kanaya", name: "Takumi Kanaya", score: "-1", thru: "F", status: "finished" },
    ],
  },
  {
    id: "g-601-1",
    label: "6:01 AM · Tee 1",
    teeTime: "6:01 AM",
    players: [
      { id: "vanrooyen", name: "Erik van Rooyen", score: "-1", thru: "F", status: "finished" },
      { id: "coody", name: "Pierceson Coody", score: "+6", thru: "F", status: "finished" },
      { id: "lebioda", name: "Hank Lebioda", score: "+3", thru: "F", status: "finished" },
    ],
  },
  {
    id: "g-601-10",
    label: "6:01 AM · Tee 10",
    teeTime: "6:01 AM",
    players: [
      { id: "list", name: "Luke List", score: "+4", thru: "F", status: "finished" },
      { id: "hoge", name: "Tom Hoge", score: "-5", thru: "F", status: "finished" },
      { id: "meissner", name: "Mac Meissner", score: "-2", thru: "F", status: "finished" },
    ],
  },
  {
    id: "g-612-1",
    label: "6:12 AM · Tee 1",
    teeTime: "6:12 AM",
    players: [
      { id: "villegas", name: "Camilo Villegas", score: "-1", thru: "F", status: "finished" },
      { id: "svensson", name: "Adam Svensson", score: "-1", thru: "F", status: "finished" },
      { id: "roy", name: "Kevin Roy", score: "-2", thru: "F", status: "finished" },
    ],
  },
  {
    id: "g-612-10",
    label: "6:12 AM · Tee 10",
    teeTime: "6:12 AM",
    players: [
      { id: "mccarthy", name: "Denny McCarthy", score: "-6", thru: "F", status: "finished" },
      { id: "stevens", name: "Sam Stevens", score: "+2", thru: "F", status: "finished" },
      { id: "hoey", name: "Rico Hoey", score: "-4", thru: "F", status: "finished" },
    ],
  },
  {
    id: "g-623-1",
    label: "6:23 AM · Tee 1",
    teeTime: "6:23 AM",
    players: [
      { id: "schenk", name: "Adam Schenk", score: "+2", thru: "F", status: "finished" },
      { id: "brennan", name: "Michael Brennan", score: "-4", thru: "F", status: "finished" },
      { id: "finau", name: "Tony Finau", score: "+1", thru: "F", status: "finished" },
    ],
  },
  {
    id: "g-623-10",
    label: "6:23 AM · Tee 10",
    teeTime: "6:23 AM",
    players: [
      { id: "fisk", name: "Steven Fisk", score: "+2", thru: "F", status: "finished" },
      { id: "english", name: "Harris English", score: "+4", thru: "F", status: "finished" },
      { id: "pendrith", name: "Taylor Pendrith", score: "-4", thru: "F", status: "finished" },
    ],
  },
  {
    id: "g-634-1",
    label: "6:34 AM · Tee 1",
    teeTime: "6:34 AM",
    players: [
      { id: "potgieter", name: "Aldrich Potgieter", score: "E", thru: "F", status: "finished" },
      { id: "highsmith", name: "Joe Highsmith", score: "-3", thru: "F", status: "finished" },
      { id: "mcnealy", name: "Maverick McNealy", score: "-3", thru: "F", status: "finished" },
    ],
  },
  {
    id: "g-634-10",
    label: "6:34 AM · Tee 10",
    teeTime: "6:34 AM",
    players: [
      { id: "thompson", name: "Davis Thompson", score: "-6", thru: "F", status: "finished" },
      { id: "im", name: "Sungjae Im", score: "-3", thru: "F", status: "finished" },
      { id: "simpson", name: "Webb Simpson", score: "E", thru: "F", status: "finished" },
    ],
  },
  {
    id: "g-645-1",
    label: "6:45 AM · Tee 1",
    teeTime: "6:45 AM",
    players: [
      { id: "campbell", name: "Brian Campbell", score: "E", thru: "F", status: "finished" },
      { id: "kyu", name: "Kevin Yu", score: "-5", thru: "F", status: "finished" },
      { id: "streelman", name: "Kevin Streelman", score: "-1", thru: "F", status: "finished" },
    ],
  },
  {
    id: "g-645-10",
    label: "6:45 AM · Tee 10",
    teeTime: "6:45 AM",
    players: [
      { id: "cyoung", name: "Cameron Young", score: "+1", thru: "F", status: "finished" },
      { id: "fitzpatrick", name: "Alex Fitzpatrick", score: "-4", thru: "F", status: "finished" },
      { id: "jthomas", name: "Justin Thomas", score: "-4", thru: "F", status: "finished" },
    ],
  },
  {
    id: "g-656-1",
    label: "6:56 AM · Tee 1",
    teeTime: "6:56 AM",
    players: [
      { id: "mazzoli", name: "Stefano Mazzoli", score: "-2", thru: "F", status: "finished" },
      { id: "castillo", name: "Ricky Castillo", score: "-3", thru: "F", status: "finished" },
      { id: "cdavis", name: "Cam Davis", score: "+2", thru: "F", status: "finished" },
    ],
  },
  {
    id: "g-656-10",
    label: "6:56 AM · Tee 10",
    teeTime: "6:56 AM",
    players: [
      { id: "cauley", name: "Bud Cauley", score: "-5", thru: "F", status: "finished" },
      { id: "bradley", name: "Keegan Bradley", score: "E", thru: "F", status: "finished" },
      { id: "koepka", name: "Brooks Koepka", score: "-3", thru: "F", status: "finished" },
    ],
  },
  {
    id: "g-707-1",
    label: "7:07 AM · Tee 1",
    teeTime: "7:07 AM",
    players: [
      { id: "mccarty", name: "Matt McCarty", score: "-4", thru: "F", status: "finished" },
      { id: "horschel", name: "Billy Horschel", score: "-5", thru: "F", status: "finished" },
      { id: "wise", name: "Aaron Wise", score: "+2", thru: "F", status: "finished" },
    ],
  },
  {
    id: "g-707-10",
    label: "7:07 AM · Tee 10",
    teeTime: "7:07 AM",
    players: [
      { id: "tkim", name: "Tom Kim", score: "-5", thru: "F", status: "finished" },
      { id: "poston", name: "J.T. Poston", score: "E", thru: "F", status: "finished" },
      { id: "rai", name: "Aaron Rai", score: "-1", thru: "F", status: "finished" },
    ],
  },
  {
    id: "g-718-1",
    label: "7:18 AM · Tee 1",
    teeTime: "7:18 AM",
    players: [
      { id: "hossler", name: "Beau Hossler", score: "-9", thru: "F", status: "finished" },
      { id: "bez", name: "Christiaan Bezuidenhout", score: "-2", thru: "F", status: "finished" },
      { id: "silverman", name: "Ben Silverman", score: "-1", thru: "F", status: "finished" },
    ],
  },
  {
    id: "g-718-10",
    label: "7:18 AM · Tee 10",
    teeTime: "7:18 AM",
    players: [
      { id: "lgriffin", name: "Lanto Griffin", score: "+1", thru: "F", status: "finished" },
      { id: "blair", name: "Zac Blair", score: "-2", thru: "F", status: "finished" },
      { id: "lower", name: "Justin Lower", score: "-1", thru: "F", status: "finished" },
    ],
  },
  {
    id: "g-729-1",
    label: "7:29 AM · Tee 1",
    teeTime: "7:29 AM",
    players: [
      { id: "garnett", name: "Brice Garnett", score: "E", thru: "F", status: "finished" },
      { id: "lipsky", name: "David Lipsky", score: "+4", thru: "F", status: "finished" },
      { id: "kohles", name: "Ben Kohles", score: "-4", thru: "F", status: "finished" },
    ],
  },
  {
    id: "g-729-10",
    label: "7:29 AM · Tee 10",
    teeTime: "7:29 AM",
    players: [
      { id: "penge", name: "Marco Penge", score: "+3", thru: "F", status: "finished" },
      { id: "chatfield", name: "Davis Chatfield", score: "-1", thru: "F", status: "finished" },
      { id: "rozo", name: "Marcelo Rozo", score: "+2", thru: "F", status: "finished" },
    ],
  },
  {
    id: "g-740-1",
    label: "7:40 AM · Tee 1",
    teeTime: "7:40 AM",
    players: [
      { id: "suber", name: "Jackson Suber", score: "-3", thru: "F", status: "finished" },
      { id: "sargent", name: "Gordon Sargent", score: "+2", thru: "F", status: "finished" },
      { id: "clanton", name: "Luke Clanton", score: "-2", thru: "F", status: "finished" },
    ],
  },
  {
    id: "g-740-10",
    label: "7:40 AM · Tee 10",
    teeTime: "7:40 AM",
    players: [
      { id: "neergaard", name: "Rasmus Neergaard-Petersen", score: "-1", thru: "F", status: "finished" },
      { id: "vanderlaan", name: "John VanDerLaan", score: "-2", thru: "F", status: "finished" },
      { id: "huskey", name: "Keenan Huskey", score: "+6", thru: "F", status: "finished" },
    ],
  },
  {
    id: "g-751-1",
    label: "7:51 AM · Tee 1",
    teeTime: "7:51 AM",
    players: [
      { id: "ventura", name: "Kristoffer Ventura", score: "-1", thru: "F", status: "finished" },
      { id: "springer", name: "Hayden Springer", score: "-6", thru: "F", status: "finished" },
      { id: "parry", name: "John Parry", score: "-4", thru: "F", status: "finished" },
    ],
  },
  {
    id: "g-751-10",
    label: "7:51 AM · Tee 10",
    teeTime: "7:51 AM",
    players: [
      { id: "dou", name: "Zecheng Dou", score: "-1", thru: "F", status: "finished" },
      { id: "nyholm", name: "Pontus Nyholm", score: "-1", thru: "F", status: "finished" },
      { id: "collet", name: "Tyler Collet", score: "-3", thru: "F", status: "finished" },
    ],
  },

  // Afternoon wave — still on course
  {
    id: "g-1110-1",
    label: "11:10 AM · Tee 1",
    teeTime: "11:10 AM",
    players: [
      { id: "hughes", name: "Mackenzie Hughes", score: "-3", thru: "10", status: "playing" },
      { id: "putnam", name: "Andrew Putnam", score: "-3", thru: "10", status: "playing" },
      { id: "ghim", name: "Doug Ghim", score: "-5", thru: "10", status: "playing" },
    ],
  },
  {
    id: "g-1110-10",
    label: "11:10 AM · Tee 10",
    teeTime: "11:10 AM",
    players: [
      { id: "mcgirt", name: "William McGirt", score: "+2", thru: "10", status: "playing" },
      { id: "wu", name: "Dylan Wu", score: "+5", thru: "10", status: "playing" },
      { id: "hojgaard", name: "Rasmus Højgaard", score: "-1", thru: "10", status: "playing" },
    ],
  },
  {
    id: "g-1121-1",
    label: "11:21 AM · Tee 1",
    teeTime: "11:21 AM",
    players: [
      { id: "wallace", name: "Matt Wallace", score: "-1", thru: "9", status: "playing" },
      { id: "mitchell", name: "Keith Mitchell", score: "-4", thru: "9", status: "playing" },
      { id: "phillips", name: "Chandler Phillips", score: "-2", thru: "9", status: "playing" },
    ],
  },
  {
    id: "g-1121-10",
    label: "11:21 AM · Tee 10",
    teeTime: "11:21 AM",
    players: [
      { id: "merritt", name: "Troy Merritt", score: "+2", thru: "9", status: "playing" },
      { id: "whaley", name: "Vince Whaley", score: "+4", thru: "9", status: "playing" },
      { id: "dwalker", name: "Danny Walker", score: "E", thru: "9", status: "playing" },
    ],
  },
  {
    id: "g-1132-1",
    label: "11:32 AM · Tee 1",
    teeTime: "11:32 AM",
    players: [
      { id: "mkim", name: "Michael Kim", score: "-2", thru: "9", status: "playing" },
      { id: "rodgers", name: "Patrick Rodgers", score: "-1", thru: "9", status: "playing" },
      { id: "greyserman", name: "Max Greyserman", score: "-1", thru: "9", status: "playing" },
    ],
  },
  {
    id: "g-1132-10",
    label: "11:32 AM · Tee 10",
    teeTime: "11:32 AM",
    players: [
      { id: "campos", name: "Rafael Campos", score: "-2", thru: "8", status: "playing" },
      { id: "pavon", name: "Matthieu Pavon", score: "+1", thru: "9", status: "playing" },
      { id: "ramey", name: "Chad Ramey", score: "-1", thru: "9", status: "playing" },
    ],
  },
  {
    id: "g-1143-1",
    label: "11:43 AM · Tee 1",
    teeTime: "11:43 AM",
    players: [
      { id: "snedeker", name: "Brandt Snedeker", score: "-3", thru: "9", status: "playing" },
      { id: "novak", name: "Andrew Novak", score: "E", thru: "9", status: "playing" },
      { id: "jaeger", name: "Stephan Jaeger", score: "-3", thru: "9", status: "playing" },
    ],
  },
  {
    id: "g-1143-10",
    label: "11:43 AM · Tee 10",
    teeTime: "11:43 AM",
    players: [
      { id: "echavarria", name: "Nico Echavarria", score: "E", thru: "8", status: "playing" },
      { id: "ntaylor", name: "Nick Taylor", score: "-1", thru: "8", status: "playing" },
      { id: "kirk", name: "Chris Kirk", score: "E", thru: "8", status: "playing" },
    ],
  },
  {
    id: "g-1154-1",
    label: "11:54 AM · Tee 1",
    teeTime: "11:54 AM",
    players: [
      { id: "koivun", name: "Jackson Koivun", score: "-1", thru: "8", status: "playing" },
      { id: "matsuyama", name: "Hideki Matsuyama", score: "-3", thru: "8", status: "playing" },
      { id: "theegala", name: "Sahith Theegala", score: "-6", thru: "8", status: "playing" },
    ],
  },
  {
    id: "g-1154-10",
    label: "11:54 AM · Tee 10",
    teeTime: "11:54 AM",
    players: [
      { id: "mouw", name: "William Mouw", score: "-1", thru: "7", status: "playing" },
      { id: "harman", name: "Brian Harman", score: "-1", thru: "7", status: "playing" },
      { id: "driley", name: "Davis Riley", score: "+4", thru: "7", status: "playing" },
    ],
  },
  {
    id: "g-1205-1",
    label: "12:05 PM · Tee 1",
    teeTime: "12:05 PM",
    players: [
      { id: "gerard", name: "Ryan Gerard", score: "-2", thru: "7", status: "playing" },
      { id: "day", name: "Jason Day", score: "E", thru: "7", status: "playing" },
      { id: "spieth", name: "Jordan Spieth", score: "+1", thru: "7", status: "playing" },
    ],
  },
  {
    id: "g-1205-10",
    label: "12:05 PM · Tee 10",
    teeTime: "12:05 PM",
    players: [
      { id: "hhall", name: "Harry Hall", score: "+2", thru: "6", status: "playing" },
      { id: "glover", name: "Lucas Glover", score: "E", thru: "6", status: "playing" },
      { id: "noren", name: "Alex Noren", score: "-1", thru: "6", status: "playing" },
    ],
  },
  {
    id: "g-1216-1",
    label: "12:16 PM · Tee 1",
    teeTime: "12:16 PM",
    players: [
      { id: "bgriffin", name: "Ben Griffin", score: "-2", thru: "6", status: "playing" },
      { id: "straka", name: "Sepp Straka", score: "+2", thru: "6", status: "playing" },
      { id: "smalley", name: "Alex Smalley", score: "-2", thru: "6", status: "playing" },
    ],
  },
  {
    id: "g-1216-10",
    label: "12:16 PM · Tee 10",
    teeTime: "12:16 PM",
    players: [
      { id: "vilips", name: "Karl Vilips", score: "-1", thru: "5", status: "playing" },
      { id: "skinns", name: "David Skinns", score: "-2", thru: "5", status: "playing" },
      { id: "kuchar", name: "Matt Kuchar", score: "+1", thru: "5", status: "playing" },
    ],
  },
  {
    id: "g-1227-1",
    label: "12:27 PM · Tee 1",
    teeTime: "12:27 PM",
    players: [
      { id: "kizzire", name: "Patton Kizzire", score: "-1", thru: "5", status: "playing" },
      { id: "hisatsune", name: "Ryo Hisatsune", score: "+1", thru: "5", status: "playing" },
      { id: "mcgreevy", name: "Max McGreevy", score: "-3", thru: "5", status: "playing" },
    ],
  },
  {
    id: "g-1227-10",
    label: "12:27 PM · Tee 10",
    teeTime: "12:27 PM",
    players: [
      { id: "dunlap", name: "Nick Dunlap", score: "+3", thru: "5", status: "playing" },
      { id: "pan", name: "C.T. Pan", score: "-1", thru: "5", status: "playing" },
      { id: "hubbard", name: "Mark Hubbard", score: "+2", thru: "5", status: "playing" },
    ],
  },
  {
    id: "g-1238-1",
    label: "12:38 PM · Tee 1",
    teeTime: "12:38 PM",
    players: [
      { id: "hodges", name: "Lee Hodges", score: "-2", thru: "4", status: "playing" },
      { id: "grillo", name: "Emiliano Grillo", score: "+2", thru: "4", status: "playing" },
      { id: "cole", name: "Eric Cole", score: "-1", thru: "4", status: "playing" },
    ],
  },
  {
    id: "g-1238-10",
    label: "12:38 PM · Tee 10",
    teeTime: "12:38 PM",
    players: [
      { id: "malnati", name: "Peter Malnati", score: "-1", thru: "4", status: "playing" },
      { id: "power", name: "Seamus Power", score: "-1", thru: "4", status: "playing" },
      { id: "dahmen", name: "Joel Dahmen", score: "-1", thru: "4", status: "playing" },
    ],
  },
  {
    id: "g-1249-1",
    label: "12:49 PM · Tee 1",
    teeTime: "12:49 PM",
    players: [
      { id: "dumont", name: "Adrien Dumont de Chassart", score: "+1", thru: "4", status: "playing" },
      { id: "bjames", name: "Ben James", score: "-2", thru: "4", status: "playing" },
      { id: "lamprecht", name: "Christo Lamprecht", score: "E", thru: "4", status: "playing" },
    ],
  },
  {
    id: "g-1249-10",
    label: "12:49 PM · Tee 10",
    teeTime: "12:49 PM",
    players: [
      { id: "hli", name: "Haotong Li", score: "-1", thru: "4", status: "playing" },
      { id: "blanchet", name: "Chandler Blanchet", score: "+1", thru: "4", status: "playing" },
      { id: "shipley", name: "Neal Shipley", score: "E", thru: "4", status: "playing" },
    ],
  },
  {
    id: "g-100-1",
    label: "1:00 PM · Tee 1",
    teeTime: "1:00 PM",
    players: [
      { id: "keefer", name: "Johnny Keefer", score: "E", thru: "3", status: "playing" },
      { id: "ewart", name: "A.J. Ewart", score: "-1", thru: "3", status: "playing" },
      { id: "bbrown", name: "Blades Brown", score: "E", thru: "3", status: "playing" },
    ],
  },
  {
    id: "g-100-10",
    label: "1:00 PM · Tee 10",
    teeTime: "1:00 PM",
    players: [
      { id: "jsvensson", name: "Jesper Svensson", score: "+1", thru: "3", status: "playing" },
      { id: "bauchou", name: "Zach Bauchou", score: "-1", thru: "3", status: "playing" },
      { id: "saddier", name: "Adrien Saddier", score: "+1", thru: "3", status: "playing" },
    ],
  },
  {
    id: "g-111-1",
    label: "1:11 PM · Tee 1",
    teeTime: "1:11 PM",
    players: [
      { id: "tosti", name: "Alejandro Tosti", score: "-1", thru: "3", status: "playing" },
      { id: "stanger", name: "Jimmy Stanger", score: "E", thru: "3", status: "playing" },
      { id: "rodriguez", name: "Lorenzo Rodriguez", score: "E", thru: "3", status: "playing" },
    ],
  },
  {
    id: "g-111-10",
    label: "1:11 PM · Tee 10",
    teeTime: "1:11 PM",
    players: [
      { id: "fishburn", name: "Patrick Fishburn", score: "+1", thru: "2", status: "playing" },
      { id: "jkang", name: "Jeffrey Kang", score: "+1", thru: "2", status: "playing" },
      { id: "akina", name: "Kihei Akina", score: "+1", thru: "2", status: "playing" },
    ],
  },
  {
    id: "g-122-10",
    label: "1:22 PM · Tee 10",
    teeTime: "1:22 PM",
    players: [
      { id: "crowe", name: "Trace Crowe", score: "E", thru: "1", status: "playing" },
      { id: "hirata", name: "Kensei Hirata", score: "+1", thru: "1", status: "playing" },
      { id: "hrabak", name: "Cooper Hrabak", score: "E", thru: "1", status: "playing" },
    ],
  },
];

function scoreColor(score: string): string {
  if (score === "-" || score === "") return "text-zinc-500";
  if (score === "E") return "text-zinc-200";
  if (score.startsWith("-")) return "text-emerald-400";
  if (score.startsWith("+")) return "text-red-400";
  return "text-zinc-200";
}

export default function PgaGroupingsPage() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFavOnly, setShowFavOnly] = useState(false);
  const [showOnCourseOnly, setShowOnCourseOnly] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem("pp-golf-favs");
      if (raw) setFavorites(new Set(JSON.parse(raw)));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("pp-golf-favs", JSON.stringify([...favorites]));
  }, [favorites, mounted]);

  function toggleFav(id: string) {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const visibleGroups = GROUPS.map((g) => ({
    ...g,
    players: g.players.filter((p) => {
      if (showFavOnly && !favorites.has(p.id)) return false;
      if (showOnCourseOnly && p.status === "finished") return false;
      return true;
    }),
  })).filter((g) => g.players.length > 0);

  return (
    <div className="min-h-screen">
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center font-bold text-zinc-950 text-lg">
                P
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">ParlayPulse</h1>
                <p className="text-xs text-zinc-500">PGA Groupings</p>
              </div>
            </Link>
            <nav className="hidden sm:flex gap-4 text-sm">
              <Link href="/" className="text-zinc-400 hover:text-white transition">
                Ticket Health
              </Link>
              <Link href="/save-the-unit" className="text-zinc-400 hover:text-white transition">
                Save the Unit
              </Link>
              <Link href="/pga-groupings" className="text-emerald-400 font-medium">
                PGA Groupings
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <section className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">{TOURNAMENT.name}</h2>
              <p className="text-sm text-zinc-400 mt-1">
                {TOURNAMENT.course} · {TOURNAMENT.round}
              </p>
              <p className="text-xs text-zinc-600 mt-1">Updated: {TOURNAMENT.lastUpdated}</p>
            </div>
            <div className="flex flex-col gap-2 text-sm text-zinc-300">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showFavOnly}
                  onChange={(e) => setShowFavOnly(e.target.checked)}
                  className="rounded border-zinc-600"
                />
                Favorites only
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showOnCourseOnly}
                  onChange={(e) => setShowOnCourseOnly(e.target.checked)}
                  className="rounded border-zinc-600"
                />
                On course only
              </label>
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-4 max-w-2xl">
            Star players on your ticket. Scores are manual for MVP — refresh after each update.
            Leader: Beau Hossler (−9).
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleGroups.map((group) => (
            <div
              key={group.id}
              className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80">
                <span className="font-semibold text-sm">{group.label}</span>
                {group.players.every((p) => p.status === "finished") && (
                  <span className="text-[10px] uppercase tracking-wide text-zinc-500">
                    Complete
                  </span>
                )}
              </div>
              <div className="divide-y divide-zinc-800/80">
                {group.players.map((p) => {
                  const isFav = favorites.has(p.id);
                  return (
                    <div
                      key={p.id}
                      className={`flex items-center gap-3 px-4 py-3 ${
                        isFav ? "bg-emerald-950/20" : ""
                      }`}
                    >
                      <button
                        onClick={() => toggleFav(p.id)}
                        className={`text-lg leading-none shrink-0 ${
                          isFav ? "text-amber-400" : "text-zinc-600 hover:text-zinc-400"
                        }`}
                        title={isFav ? "Unfavorite" : "Favorite"}
                      >
                        {isFav ? "★" : "☆"}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{p.name}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={`text-sm font-mono font-semibold ${scoreColor(p.score)}`}>
                          {p.score}
                        </div>
                        <div className="text-[11px] text-zinc-500">{p.thru}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {visibleGroups.length === 0 && (
          <div className="text-center text-zinc-500 py-12">
            No groups match the current filters.
          </div>
        )}

        <footer className="text-center text-xs text-zinc-600 pt-4 pb-6">
          Scores manually maintained for MVP. Not a live feed. For tracking only.
        </footer>
      </main>
    </div>
  );
}
