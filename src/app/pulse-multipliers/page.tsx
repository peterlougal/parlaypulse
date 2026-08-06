"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

/**
 * Pulse Multipliers — highest-tier style ticket builder
 * Uses PropFinder-style ratings + odds to pack legs toward 10x/20x/50x/100x
 */

type PropRow = {
  sport: string;
  team: string;
  pos: string;
  player: string;
  prop: string;
  odds: number;
  dec: number;
  rating: number;
  streak: number;
  l5: string;
  l10: string;
};

type TicketStyle = "props_heavy" | "balanced" | "favorites" | "longshots";

type BuiltTicket = {
  style: TicketStyle;
  title: string;
  subtitle: string;
  legs: PropRow[];
  combinedDec: number;
  combinedAmerican: string;
  approxMult: number;
  hitProb: number; // 0–1 product of market implied probs
};

const PROPS_DATA: Record<string, PropRow[]> = {"WNBA":[{"sport":"WNBA","team":"IND","pos":"SG","player":"Kelsey Mitchell","prop":"o2.5 Three Pointers","odds":-127,"dec":1.7874,"rating":88.9,"streak":14,"l5":"(5/5)","l10":"(10/10)"},{"sport":"WNBA","team":"LVA","pos":"SF","player":"Jackie Young","prop":"o4.5 Q1 Points","odds":-152,"dec":1.6579,"rating":88.3,"streak":6,"l5":"(5/5)","l10":"(8/10)"},{"sport":"WNBA","team":"LVA","pos":"C","player":"A'ja Wilson","prop":"o0.5 Three Pointers","odds":-132,"dec":1.7576,"rating":87.9,"streak":6,"l5":"(5/5)","l10":"(9/10)"},{"sport":"WNBA","team":"IND","pos":"C","player":"Aliyah Boston","prop":"o6 Field Goals Made","odds":-137,"dec":1.7299,"rating":87.9,"streak":1,"l5":"(3/5)","l10":"(7/10)"},{"sport":"WNBA","team":"IND","pos":"C","player":"Aliyah Boston","prop":"o3.5 Q1 Points","odds":-148,"dec":1.6757,"rating":87.7,"streak":4,"l5":"(4/5)","l10":"(7/10)"},{"sport":"WNBA","team":"IND","pos":"C","player":"Aliyah Boston","prop":"o5 Two Pointers Made","odds":-137,"dec":1.7299,"rating":87.4,"streak":2,"l5":"(4/5)","l10":"(6/10)"},{"sport":"WNBA","team":"IND","pos":"C","player":"Aliyah Boston","prop":"o19.5 Points + Assists","odds":-114,"dec":1.8772,"rating":85.1,"streak":2,"l5":"(3/5)","l10":"(6/10)"},{"sport":"WNBA","team":"PDX","pos":"SF","player":"Bridget Carleton","prop":"o3.5 Rebounds","odds":-120,"dec":1.8333,"rating":84.4,"streak":1,"l5":"(4/5)","l10":"(6/10)"},{"sport":"WNBA","team":"IND","pos":"SF","player":"Lexie Hull","prop":"o0.5 Three Pointers","odds":-171,"dec":1.5848,"rating":81.6,"streak":2,"l5":"(4/5)","l10":"(6/10)"},{"sport":"WNBA","team":"IND","pos":"SG","player":"Kelsey Mitchell","prop":"o9.5 Two Pointers Attempted","odds":-137,"dec":1.7299,"rating":81.6,"streak":1,"l5":"(3/5)","l10":"(6/10)"},{"sport":"WNBA","team":"MIN","pos":"SG","player":"Courtney Williams","prop":"o0.5 Three Pointers","odds":-127,"dec":1.7874,"rating":80.5,"streak":3,"l5":"(4/5)","l10":"(7/10)"},{"sport":"WNBA","team":"MIN","pos":"SG","player":"Courtney Williams","prop":"o21.5 Pts + Reb + Ast","odds":-118,"dec":1.8475,"rating":80.1,"streak":2,"l5":"(3/5)","l10":"(7/10)"},{"sport":"WNBA","team":"TOR","pos":"SG","player":"Marina Mabrey","prop":"o7.5 Rebounds + Assists","odds":-112,"dec":1.8929,"rating":79.8,"streak":1,"l5":"(2/5)","l10":"(4/10)"},{"sport":"WNBA","team":"IND","pos":"G","player":"Sophie Cunningham","prop":"o8.5 Points","odds":-114,"dec":1.8772,"rating":79.7,"streak":0,"l5":"(3/5)","l10":"(6/10)"},{"sport":"WNBA","team":"LVA","pos":"SF","player":"Jackie Young","prop":"o6.5 Assists","odds":-106,"dec":1.9434,"rating":79.6,"streak":1,"l5":"(3/5)","l10":"(5/10)"},{"sport":"WNBA","team":"IND","pos":"SG","player":"Kelsey Mitchell","prop":"o5.5 Q1 Points","odds":-136,"dec":1.7353,"rating":79.3,"streak":1,"l5":"(3/5)","l10":"(8/10)"},{"sport":"WNBA","team":"IND","pos":"G","player":"Sophie Cunningham","prop":"o1.5 Three Pointers","odds":-110,"dec":1.9091,"rating":79.0,"streak":0,"l5":"(3/5)","l10":"(5/10)"},{"sport":"WNBA","team":"MIN","pos":"SG","player":"Courtney Williams","prop":"o3.5 Assists","odds":-123,"dec":1.813,"rating":78.6,"streak":4,"l5":"(4/5)","l10":"(7/10)"},{"sport":"WNBA","team":"MIN","pos":"SG","player":"Courtney Williams","prop":"o17.5 Points + Assists","odds":-108,"dec":1.9259,"rating":78.5,"streak":2,"l5":"(3/5)","l10":"(6/10)"},{"sport":"WNBA","team":"TOR","pos":"SF","player":"Maria Conde","prop":"o1.5 Three Pointers","odds":-118,"dec":1.8475,"rating":78.4,"streak":1,"l5":"(3/5)","l10":"(5/10)"},{"sport":"WNBA","team":"LVA","pos":"SG","player":"Jewell Loyd","prop":"o1.5 Three Pointers","odds":-111,"dec":1.9009,"rating":78.0,"streak":1,"l5":"(4/5)","l10":"(8/10)"},{"sport":"WNBA","team":"TOR","pos":"SF","player":"Maria Conde","prop":"o4.5 Rebounds","odds":109,"dec":2.09,"rating":77.6,"streak":2,"l5":"(4/5)","l10":"(4/10)"},{"sport":"WNBA","team":"LVA","pos":"SF","player":"Jackie Young","prop":"o1.5 Three Pointers","odds":-130,"dec":1.7692,"rating":77.5,"streak":4,"l5":"(4/5)","l10":"(7/10)"},{"sport":"WNBA","team":"MIN","pos":"SF","player":"Kayla McBride","prop":"o2.5 Three Pointers","odds":-122,"dec":1.8197,"rating":77.4,"streak":0,"l5":"(4/5)","l10":"(7/10)"},{"sport":"WNBA","team":"MIN","pos":"SG","player":"Courtney Williams","prop":"o3.5 Q1 Points","odds":-138,"dec":1.7246,"rating":77.3,"streak":2,"l5":"(3/5)","l10":"(6/10)"},{"sport":"WNBA","team":"TOR","pos":"SG","player":"Marina Mabrey","prop":"o3.5 Rebounds","odds":107,"dec":2.07,"rating":77.0,"streak":1,"l5":"(3/5)","l10":"(5/10)"},{"sport":"WNBA","team":"IND","pos":"PG","player":"Caitlin Clark","prop":"o5.5 Free Throws Made","odds":-137,"dec":1.7299,"rating":77.0,"streak":0,"l5":"(3/5)","l10":"(5/10)"},{"sport":"WNBA","team":"MIN","pos":"SG","player":"Courtney Williams","prop":"o17.5 Points + Rebounds","odds":-112,"dec":1.8929,"rating":76.9,"streak":2,"l5":"(3/5)","l10":"(5/10)"},{"sport":"WNBA","team":"MIN","pos":"SG","player":"Courtney Williams","prop":"o8.5 Rebounds + Assists","odds":107,"dec":2.07,"rating":76.5,"streak":1,"l5":"(2/5)","l10":"(6/10)"},{"sport":"WNBA","team":"LVA","pos":"SF","player":"Jackie Young","prop":"o5 Two Pointers Made","odds":-137,"dec":1.7299,"rating":76.5,"streak":1,"l5":"(3/5)","l10":"(6/10)"},{"sport":"WNBA","team":"MIN","pos":"PG","player":"Olivia Miles","prop":"o23.5 Points + Rebounds","odds":-122,"dec":1.8197,"rating":76.0,"streak":1,"l5":"(3/5)","l10":"(5/10)"},{"sport":"WNBA","team":"MIN","pos":"PG","player":"Olivia Miles","prop":"o30.5 Pts + Reb + Ast","odds":-110,"dec":1.9091,"rating":76.0,"streak":1,"l5":"(3/5)","l10":"(5/10)"},{"sport":"WNBA","team":"MIN","pos":"PF","player":"Napheesa Collier","prop":"o5.5 Two Pointers Made","odds":-137,"dec":1.7299,"rating":76.0,"streak":0,"l5":"(3/5)","l10":"(7/10)"},{"sport":"WNBA","team":"MIN","pos":"SG","player":"Courtney Williams","prop":"o4.5 Two Pointers Made","odds":-137,"dec":1.7299,"rating":75.6,"streak":2,"l5":"(3/5)","l10":"(6/10)"},{"sport":"WNBA","team":"IND","pos":"PG","player":"Tyasha Harris","prop":"o3.5 Points","odds":-135,"dec":1.7407,"rating":75.4,"streak":0,"l5":"(2/5)","l10":"(7/10)"},{"sport":"WNBA","team":"MIN","pos":"PG","player":"Olivia Miles","prop":"o19.5 Points","odds":-106,"dec":1.9434,"rating":75.3,"streak":1,"l5":"(3/5)","l10":"(5/10)"},{"sport":"WNBA","team":"MIN","pos":"PG","player":"Olivia Miles","prop":"o26.5 Points + Assists","odds":-108,"dec":1.9259,"rating":75.3,"streak":1,"l5":"(3/5)","l10":"(5/10)"},{"sport":"WNBA","team":"MIN","pos":"SF","player":"Kayla McBride","prop":"o1.5 Assists","odds":-135,"dec":1.7407,"rating":75.3,"streak":0,"l5":"(3/5)","l10":"(5/10)"},{"sport":"WNBA","team":"MIN","pos":"SG","player":"Courtney Williams","prop":"o11.5 Field Goals Attempted","odds":-137,"dec":1.7299,"rating":75.1,"streak":1,"l5":"(2/5)","l10":"(6/10)"},{"sport":"WNBA","team":"LVA","pos":"SF","player":"Jackie Young","prop":"o25.5 Points + Assists","odds":-106,"dec":1.9434,"rating":74.9,"streak":1,"l5":"(4/5)","l10":"(6/10)"},{"sport":"WNBA","team":"TOR","pos":"SF","player":"Maria Conde","prop":"o13.5 Points + Assists","odds":-114,"dec":1.8772,"rating":74.8,"streak":2,"l5":"(4/5)","l10":"(7/10)"},{"sport":"WNBA","team":"PDX","pos":"SF","player":"Bridget Carleton","prop":"o2.5 Three Pointers","odds":-119,"dec":1.8403,"rating":74.7,"streak":3,"l5":"(4/5)","l10":"(6/10)"},{"sport":"WNBA","team":"PDX","pos":"SF","player":"Bridget Carleton","prop":"o19.5 Points + Rebounds","odds":-114,"dec":1.8772,"rating":74.7,"streak":2,"l5":"(4/5)","l10":"(5/10)"},{"sport":"WNBA","team":"TOR","pos":"SF","player":"Maria Conde","prop":"o7.5 Rebounds + Assists","odds":-108,"dec":1.9259,"rating":74.6,"streak":2,"l5":"(4/5)","l10":"(6/10)"},{"sport":"WNBA","team":"LVA","pos":"PG","player":"Chelsea Gray","prop":"o18.5 Points + Assists","odds":-110,"dec":1.9091,"rating":74.3,"streak":1,"l5":"(4/5)","l10":"(6/10)"},{"sport":"WNBA","team":"LVA","pos":"SF","player":"Jackie Young","prop":"o18.5 Points","odds":-114,"dec":1.8772,"rating":74.3,"streak":1,"l5":"(4/5)","l10":"(6/10)"},{"sport":"WNBA","team":"IND","pos":"PG","player":"Caitlin Clark","prop":"o2.5 Three Pointers","odds":-111,"dec":1.9009,"rating":74.3,"streak":0,"l5":"(2/5)","l10":"(4/10)"},{"sport":"WNBA","team":"MIN","pos":"SG","player":"Courtney Williams","prop":"o8.5 Two Pointers Attempted","odds":-137,"dec":1.7299,"rating":74.1,"streak":1,"l5":"(3/5)","l10":"(7/10)"},{"sport":"WNBA","team":"IND","pos":"PG","player":"Caitlin Clark","prop":"o5.5 Q1 Points","odds":-112,"dec":1.8929,"rating":74.0,"streak":0,"l5":"(3/5)","l10":"(4/10)"},{"sport":"WNBA","team":"IND","pos":"PG","player":"Caitlin Clark","prop":"o21.5 Points","odds":-114,"dec":1.8772,"rating":74.0,"streak":0,"l5":"(3/5)","l10":"(4/10)"},{"sport":"WNBA","team":"TOR","pos":"SF","player":"Maria Conde","prop":"o17.5 Pts + Reb + Ast","odds":-130,"dec":1.7692,"rating":73.8,"streak":2,"l5":"(4/5)","l10":"(7/10)"},{"sport":"WNBA","team":"TOR","pos":"SF","player":"Maria Conde","prop":"o14.5 Points + Rebounds","odds":-120,"dec":1.8333,"rating":73.6,"streak":2,"l5":"(4/5)","l10":"(7/10)"},{"sport":"WNBA","team":"MIN","pos":"SF","player":"Kayla McBride","prop":"o4.5 Q1 Points","odds":-102,"dec":1.9804,"rating":73.3,"streak":6,"l5":"(5/5)","l10":"(8/10)"},{"sport":"WNBA","team":"IND","pos":"SG","player":"Kelsey Mitchell","prop":"o8.5 Field Goals Made","odds":-137,"dec":1.7299,"rating":73.3,"streak":6,"l5":"(5/5)","l10":"(8/10)"},{"sport":"WNBA","team":"LVA","pos":"SF","player":"Jackie Young","prop":"o23.5 Points + Rebounds","odds":-110,"dec":1.9091,"rating":73.3,"streak":6,"l5":"(5/5)","l10":"(6/10)"},{"sport":"WNBA","team":"LVA","pos":"PG","player":"Chelsea Gray","prop":"o12.5 Points","odds":106,"dec":2.06,"rating":73.1,"streak":1,"l5":"(4/5)","l10":"(6/10)"},{"sport":"WNBA","team":"PDX","pos":"SF","player":"Bridget Carleton","prop":"o15.5 Points","odds":-111,"dec":1.9009,"rating":73.0,"streak":2,"l5":"(4/5)","l10":"(4/10)"},{"sport":"WNBA","team":"PDX","pos":"SF","player":"Bridget Carleton","prop":"o23.5 Pts + Reb + Ast","odds":-106,"dec":1.9434,"rating":73.0,"streak":2,"l5":"(4/5)","l10":"(4/10)"},{"sport":"WNBA","team":"MIN","pos":"PF","player":"Napheesa Collier","prop":"o7 Field Goals Made","odds":-137,"dec":1.7299,"rating":73.0,"streak":0,"l5":"(3/5)","l10":"(8/10)"},{"sport":"WNBA","team":"MIN","pos":"PF","player":"Napheesa Collier","prop":"o10 Two Pointers Attempted","odds":-137,"dec":1.7299,"rating":73.0,"streak":0,"l5":"(4/5)","l10":"(7/10)"}],"MLB":[{"sport":"MLB","team":"ARI","pos":"CF","player":"Ryan Waldschmidt","prop":"o0.5 Hits + Runs + RBIs","odds":-119,"dec":1.8403,"rating":85.6,"streak":2,"l5":"(4/5)","l10":"(8/10)"},{"sport":"MLB","team":"ARI","pos":"CF","player":"Ryan Waldschmidt","prop":"o0.5 Hits","odds":-120,"dec":1.8333,"rating":85.6,"streak":2,"l5":"(4/5)","l10":"(8/10)"},{"sport":"MLB","team":"TOR","pos":"RF","player":"George Springer","prop":"o0.5 Hits","odds":-194,"dec":1.5155,"rating":85.1,"streak":0,"l5":"(4/5)","l10":"(9/10)"},{"sport":"MLB","team":"CWS","pos":"3B","player":"Munetaka Murakami","prop":"o0.5 Hits","odds":-119,"dec":1.8403,"rating":84.6,"streak":0,"l5":"(4/5)","l10":"(9/10)"},{"sport":"MLB","team":"CHC","pos":"RF","player":"Seiya Suzuki","prop":"o0.5 Hits","odds":-142,"dec":1.7042,"rating":83.4,"streak":5,"l5":"(5/5)","l10":"(9/10)"},{"sport":"MLB","team":"SEA","pos":"SS","player":"Cole Young","prop":"o0.5 Hits","odds":-195,"dec":1.5128,"rating":82.3,"streak":0,"l5":"(3/5)","l10":"(8/10)"},{"sport":"MLB","team":"CHC","pos":"RF","player":"Seiya Suzuki","prop":"o1.5 Hits + Runs + RBIs","odds":121,"dec":2.21,"rating":81.9,"streak":5,"l5":"(5/5)","l10":"(8/10)"},{"sport":"MLB","team":"ARI","pos":"C","player":"Gabriel Moreno","prop":"o0.5 RBIs","odds":186,"dec":2.86,"rating":81.9,"streak":1,"l5":"(4/5)","l10":"(8/10)"},{"sport":"MLB","team":"TOR","pos":"2B","player":"Andres Gimenez","prop":"o0.5 Runs","odds":180,"dec":2.8,"rating":81.5,"streak":0,"l5":"(3/5)","l10":"(3/10)"},{"sport":"MLB","team":"PHI","pos":"2B","player":"Bryson Stott","prop":"o1.5 Hits + Runs + RBIs","odds":-110,"dec":1.9091,"rating":80.3,"streak":5,"l5":"(5/5)","l10":"(8/10)"},{"sport":"MLB","team":"TOR","pos":"2B","player":"Andres Gimenez","prop":"o0.5 Hits","odds":-116,"dec":1.8621,"rating":80.0,"streak":0,"l5":"(2/5)","l10":"(4/10)"},{"sport":"MLB","team":"TOR","pos":"2B","player":"Andres Gimenez","prop":"o1.5 Hits + Runs + RBIs","odds":134,"dec":2.34,"rating":80.0,"streak":0,"l5":"(2/5)","l10":"(4/10)"},{"sport":"MLB","team":"ARI","pos":"CF","player":"Ryan Waldschmidt","prop":"o0.5 Runs","odds":174,"dec":2.74,"rating":79.6,"streak":1,"l5":"(3/5)","l10":"(6/10)"},{"sport":"MLB","team":"SEA","pos":"SS","player":"Cole Young","prop":"o1.5 Hits + Runs + RBIs","odds":-105,"dec":1.9524,"rating":79.3,"streak":0,"l5":"(3/5)","l10":"(6/10)"},{"sport":"MLB","team":"CWS","pos":"LF","player":"Miguel Vargas","prop":"o0.5 Hits","odds":-133,"dec":1.7519,"rating":78.4,"streak":1,"l5":"(3/5)","l10":"(7/10)"},{"sport":"MLB","team":"CWS","pos":"SS","player":"Colson Montgomery","prop":"o0.5 Hits","odds":-122,"dec":1.8197,"rating":78.1,"streak":0,"l5":"(3/5)","l10":"(5/10)"},{"sport":"MLB","team":"CWS","pos":"SS","player":"Colson Montgomery","prop":"o1.5 Hits + Runs + RBIs","odds":120,"dec":2.2,"rating":78.1,"streak":0,"l5":"(3/5)","l10":"(5/10)"},{"sport":"MLB","team":"MIA","pos":"IF","player":"Javier Sanoja","prop":"o0.5 Hits","odds":-133,"dec":1.7519,"rating":77.8,"streak":2,"l5":"(4/5)","l10":"(6/10)"},{"sport":"MLB","team":"SEA","pos":"SS","player":"Cole Young","prop":"o0.5 Runs","odds":175,"dec":2.75,"rating":77.8,"streak":0,"l5":"(3/5)","l10":"(5/10)"},{"sport":"MLB","team":"MIA","pos":"SS","player":"Xavier Edwards","prop":"o0.5 Hits","odds":-141,"dec":1.7092,"rating":77.5,"streak":1,"l5":"(3/5)","l10":"(8/10)"},{"sport":"MLB","team":"ARI","pos":"C","player":"Gabriel Moreno","prop":"o1.5 Hits + Runs + RBIs","odds":-122,"dec":1.8197,"rating":77.4,"streak":1,"l5":"(3/5)","l10":"(7/10)"},{"sport":"MLB","team":"MIA","pos":"3B","player":"Otto Lopez","prop":"o1.5 Hits + Runs + RBIs","odds":-118,"dec":1.8475,"rating":77.3,"streak":0,"l5":"(3/5)","l10":"(5/10)"},{"sport":"MLB","team":"MIA","pos":"3B","player":"Otto Lopez","prop":"o0.5 Runs","odds":110,"dec":2.1,"rating":77.3,"streak":0,"l5":"(3/5)","l10":"(5/10)"},{"sport":"MLB","team":"KC","pos":"1B","player":"Jac Caglianone","prop":"o0.5 Hits","odds":-139,"dec":1.7194,"rating":76.9,"streak":4,"l5":"(4/5)","l10":"(6/10)"},{"sport":"MLB","team":"CWS","pos":"SS","player":"Colson Montgomery","prop":"o0.5 Runs","odds":160,"dec":2.6,"rating":76.6,"streak":0,"l5":"(3/5)","l10":"(4/10)"},{"sport":"MLB","team":"CHC","pos":"3B","player":"Alex Bregman","prop":"o0.5 Hits","odds":-116,"dec":1.8621,"rating":76.3,"streak":3,"l5":"(4/5)","l10":"(9/10)"},{"sport":"MLB","team":"SEA","pos":"LF","player":"Randy Arozarena","prop":"o0.5 Hits","odds":-205,"dec":1.4878,"rating":76.1,"streak":4,"l5":"(4/5)","l10":"(7/10)"},{"sport":"MLB","team":"SEA","pos":"LF","player":"Randy Arozarena","prop":"o0.5 Runs","odds":108,"dec":2.08,"rating":76.1,"streak":1,"l5":"(4/5)","l10":"(7/10)"},{"sport":"MLB","team":"PHI","pos":"2B","player":"Bryson Stott","prop":"o0.5 Hits","odds":-139,"dec":1.7194,"rating":75.8,"streak":3,"l5":"(4/5)","l10":"(7/10)"},{"sport":"MLB","team":"CHC","pos":"2B","player":"Nico Hoerner","prop":"o0.5 Hits","odds":-169,"dec":1.5917,"rating":75.8,"streak":2,"l5":"(4/5)","l10":"(7/10)"},{"sport":"MLB","team":"ARI","pos":"2B","player":"Tim Tawa","prop":"o0.5 Runs","odds":160,"dec":2.6,"rating":75.7,"streak":3,"l5":"(3/5)","l10":"(5/10)"},{"sport":"MLB","team":"CHC","pos":"CF","player":"Pete Crow-Armstrong","prop":"o0.5 Hits","odds":-185,"dec":1.5405,"rating":75.4,"streak":3,"l5":"(4/5)","l10":"(6/10)"},{"sport":"MLB","team":"CHC","pos":"CF","player":"Pete Crow-Armstrong","prop":"o1.5 Hits + Runs + RBIs","odds":105,"dec":2.05,"rating":75.4,"streak":3,"l5":"(4/5)","l10":"(6/10)"},{"sport":"MLB","team":"CWS","pos":"LF","player":"Miguel Vargas","prop":"o1.5 Hits + Runs + RBIs","odds":105,"dec":2.05,"rating":75.4,"streak":1,"l5":"(3/5)","l10":"(5/10)"},{"sport":"MLB","team":"TOR","pos":"RF","player":"George Springer","prop":"o1.5 Hits + Runs + RBIs","odds":-105,"dec":1.9524,"rating":74.6,"streak":0,"l5":"(2/5)","l10":"(6/10)"},{"sport":"MLB","team":"CHC","pos":"RF","player":"Seiya Suzuki","prop":"o0.5 Runs","odds":133,"dec":2.33,"rating":74.4,"streak":1,"l5":"(3/5)","l10":"(7/10)"},{"sport":"MLB","team":"CWS","pos":"RF","player":"Randal Grichuk","prop":"o0.5 Hits","odds":-120,"dec":1.8333,"rating":74.2,"streak":0,"l5":"(3/5)","l10":"(5/10)"},{"sport":"MLB","team":"PHI","pos":"1B","player":"Bryce Harper","prop":"o0.5 Runs","odds":-112,"dec":1.8929,"rating":74.1,"streak":0,"l5":"(4/5)","l10":"(7/10)"},{"sport":"MLB","team":"CHC","pos":"CF","player":"Pete Crow-Armstrong","prop":"o0.5 Runs","odds":108,"dec":2.08,"rating":73.9,"streak":3,"l5":"(4/5)","l10":"(5/10)"},{"sport":"MLB","team":"CWS","pos":"LF","player":"Miguel Vargas","prop":"o0.5 RBIs","odds":181,"dec":2.81,"rating":73.9,"streak":0,"l5":"(3/5)","l10":"(4/10)"},{"sport":"MLB","team":"ARI","pos":"3B","player":"Nolan Arenado","prop":"o0.5 Hits","odds":-122,"dec":1.8197,"rating":73.6,"streak":2,"l5":"(3/5)","l10":"(4/10)"},{"sport":"MLB","team":"ARI","pos":"3B","player":"Nolan Arenado","prop":"o1.5 Hits + Runs + RBIs","odds":110,"dec":2.1,"rating":73.6,"streak":2,"l5":"(3/5)","l10":"(4/10)"},{"sport":"MLB","team":"CHC","pos":"3B","player":"Alex Bregman","prop":"o1.5 Hits + Runs + RBIs","odds":120,"dec":2.2,"rating":73.3,"streak":3,"l5":"(4/5)","l10":"(7/10)"},{"sport":"MLB","team":"TOR","pos":"3B","player":"Kazuma Okamoto","prop":"o0.5 Hits","odds":-200,"dec":1.5,"rating":73.3,"streak":1,"l5":"(3/5)","l10":"(7/10)"},{"sport":"MLB","team":"TOR","pos":"3B","player":"Ernie Clement","prop":"o0.5 Hits","odds":-139,"dec":1.7194,"rating":73.3,"streak":1,"l5":"(2/5)","l10":"(6/10)"},{"sport":"MLB","team":"SEA","pos":"SS","player":"Colt Emerson","prop":"o0.5 Hits + Runs + RBIs","odds":-165,"dec":1.6061,"rating":73.3,"streak":1,"l5":"(3/5)","l10":"(6/10)"},{"sport":"MLB","team":"SEA","pos":"SS","player":"Colt Emerson","prop":"o0.5 Hits","odds":-106,"dec":1.9434,"rating":73.3,"streak":1,"l5":"(3/5)","l10":"(6/10)"},{"sport":"MLB","team":"CWS","pos":"CF","player":"Brenton Doyle","prop":"o0.5 Hits + Runs + RBIs","odds":-123,"dec":1.813,"rating":73.3,"streak":0,"l5":"(3/5)","l10":"(6/10)"},{"sport":"MLB","team":"CWS","pos":"CF","player":"Brenton Doyle","prop":"o0.5 Hits","odds":-110,"dec":1.9091,"rating":73.3,"streak":0,"l5":"(3/5)","l10":"(6/10)"},{"sport":"MLB","team":"ATL","pos":"1B","player":"Matt Olson","prop":"o1.5 Hits + Runs + RBIs","odds":-118,"dec":1.8475,"rating":73.1,"streak":0,"l5":"(4/5)","l10":"(7/10)"},{"sport":"MLB","team":"TOR","pos":"RF","player":"George Springer","prop":"o0.5 Runs","odds":130,"dec":2.3,"rating":73.1,"streak":0,"l5":"(2/5)","l10":"(5/10)"},{"sport":"MLB","team":"ARI","pos":"C","player":"Gabriel Moreno","prop":"o0.5 Hits","odds":-137,"dec":1.7299,"rating":72.9,"streak":0,"l5":"(2/5)","l10":"(6/10)"},{"sport":"MLB","team":"KC","pos":"2B","player":"Michael Massey","prop":"o0.5 Hits","odds":-128,"dec":1.7812,"rating":72.7,"streak":3,"l5":"(3/5)","l10":"(6/10)"},{"sport":"MLB","team":"ARI","pos":"2B","player":"Tim Tawa","prop":"o0.5 Hits","odds":-116,"dec":1.8621,"rating":72.7,"streak":1,"l5":"(3/5)","l10":"(3/10)"},{"sport":"MLB","team":"CHC","pos":"1B","player":"Michael Busch","prop":"o0.5 Hits","odds":-153,"dec":1.6536,"rating":72.6,"streak":1,"l5":"(4/5)","l10":"(6/10)"},{"sport":"MLB","team":"CHC","pos":"1B","player":"Michael Busch","prop":"o1.5 Hits + Runs + RBIs","odds":122,"dec":2.22,"rating":72.6,"streak":1,"l5":"(4/5)","l10":"(6/10)"},{"sport":"MLB","team":"ARI","pos":"3B","player":"Nolan Arenado","prop":"o0.5 Runs","odds":165,"dec":2.65,"rating":72.1,"streak":2,"l5":"(3/5)","l10":"(3/10)"},{"sport":"MLB","team":"SEA","pos":"LF","player":"Dominic Canzone","prop":"o0.5 Hits","odds":-200,"dec":1.5,"rating":71.9,"streak":0,"l5":"(3/5)","l10":"(7/10)"},{"sport":"MLB","team":"CHC","pos":"SS","player":"Dansby Swanson","prop":"o0.5 Hits + Runs + RBIs","odds":-123,"dec":1.813,"rating":71.8,"streak":3,"l5":"(3/5)","l10":"(7/10)"},{"sport":"MLB","team":"CWS","pos":"LF","player":"Miguel Vargas","prop":"o1.5 Total Bases","odds":130,"dec":2.3,"rating":71.8,"streak":1,"l5":"(3/5)","l10":"(5/10)"}]};

const BUCKETS = [
  { key: 10, label: "10x", desc: "Shorter legs · higher hit rate focus" },
  { key: 20, label: "20x", desc: "Mix of favorites and mid-range props" },
  { key: 50, label: "50x", desc: "Longer ticket · more variance" },
  { key: 100, label: "100x", desc: "Max upside · need several legs to clear" },
] as const;

const SPORTS = [
  { key: "MLB", available: true },
  { key: "WNBA", available: true },
  { key: "NFL", available: false },
  { key: "NBA", available: false },
  { key: "NHL", available: false },
  { key: "MLS", available: false },
] as const;

function americanFromDec(dec: number): string {
  if (dec <= 1) return "—";
  if (dec >= 2) return `+${Math.round((dec - 1) * 100)}`;
  return `-${Math.round(100 / (dec - 1))}`;
}

/** Single-leg implied win% from American odds (raw market, no vig strip). */
function impliedFromAmerican(odds: number): number {
  if (odds > 0) return 100 / (odds + 100);
  return Math.abs(odds) / (Math.abs(odds) + 100);
}

/** Ticket hit probability = product of leg implied probs (independent assumption). */
function ticketHitProb(legs: PropRow[]): number {
  let p = 1;
  for (const leg of legs) {
    p *= impliedFromAmerican(leg.odds);
  }
  return p;
}

function parseHitRate(s: string): number | null {
  // "(8/10)" → 0.8
  const m = /^\((\d+)\/(\d+)\)$/.exec((s || "").trim());
  if (!m) return null;
  const a = Number(m[1]);
  const b = Number(m[2]);
  if (!b) return null;
  return a / b;
}

/**
 * Rank like a prop analyst would from PropFinder:
 * PF rating first, then streak, L5/L10 hit rates, mild odds bias by style.
 */
function scoreProp(p: PropRow, preferLong: boolean): number {
  const l5 = parseHitRate(p.l5);
  const l10 = parseHitRate(p.l10);
  let s = p.rating * 3; // PF is primary signal
  s += p.streak * 4;
  if (l5 !== null) s += l5 * 25;
  if (l10 !== null) s += l10 * 18;
  // Soft penalty if L10 is weak despite high rating
  if (l10 !== null && l10 < 0.4) s -= 12;
  if (preferLong) s += Math.min(p.dec, 5) * 6;
  else s += Math.max(0, 2.4 - p.dec) * 12;
  return s;
}

function packTicket(
  pool: PropRow[],
  targetMult: number,
  style: TicketStyle
): BuiltTicket | null {
  if (pool.length < 2) return null;

  const preferLong = targetMult >= 50 || style === "longshots";
  const preferShort = style === "favorites" || targetMult <= 10;

  let candidates = [...pool].sort(
    (a, b) => scoreProp(b, preferLong && !preferShort) - scoreProp(a, preferLong && !preferShort)
  );

  // Style filters
  if (style === "favorites") {
    candidates = candidates.filter((p) => p.dec <= 2.1).slice(0, 40);
  } else if (style === "longshots") {
    candidates = candidates.filter((p) => p.dec >= 1.7).slice(0, 40);
  } else if (style === "props_heavy") {
    candidates = candidates.slice(0, 50);
  } else {
    candidates = candidates.slice(0, 45);
  }

  if (candidates.length < 2) candidates = [...pool].slice(0, 30);

  // Greedy pack toward target, avoid same player twice
  const legs: PropRow[] = [];
  const usedPlayers = new Set<string>();
  let product = 1;
  const maxLegs = targetMult >= 50 ? 8 : targetMult >= 20 ? 6 : 5;
  const minLegs = targetMult >= 50 ? 4 : 3;

  for (const p of candidates) {
    if (legs.length >= maxLegs) break;
    const key = `${p.sport}-${p.player}`;
    if (usedPlayers.has(key)) continue;
    const next = product * p.dec;
    // Don't overshoot too early unless we have few legs
    if (legs.length >= minLegs - 1 && next > targetMult * 1.35 && product >= targetMult * 0.85) {
      continue;
    }
    legs.push(p);
    usedPlayers.add(key);
    product = next;
    if (product >= targetMult * 0.92 && legs.length >= minLegs) break;
  }

  // If under target, keep adding mid-price legs
  if (product < targetMult * 0.85) {
    for (const p of candidates) {
      if (legs.length >= maxLegs) break;
      const key = `${p.sport}-${p.player}`;
      if (usedPlayers.has(key)) continue;
      legs.push(p);
      usedPlayers.add(key);
      product *= p.dec;
      if (product >= targetMult * 0.9) break;
    }
  }

  if (legs.length < 2) return null;

  const titles: Record<TicketStyle, string> = {
    props_heavy: "Prop stack",
    balanced: "Balanced mix",
    favorites: "Shorter-price focus",
    longshots: "Upside mix",
  };
  const subs: Record<TicketStyle, string> = {
    props_heavy: "Ranked by PF rating + streak",
    balanced: "Spread across players & lines",
    favorites: "Lean chalkier props",
    longshots: "More variance for the multiplier",
  };

  return {
    style,
    title: titles[style],
    subtitle: subs[style],
    legs,
    combinedDec: product,
    combinedAmerican: americanFromDec(product),
    approxMult: Math.round(product * 10) / 10,
    hitProb: ticketHitProb(legs),
  };
}

function buildAll(
  sports: string[],
  target: number
): BuiltTicket[] {
  const pool = sports.flatMap((s) => PROPS_DATA[s] || []);
  if (!pool.length) return [];

  const styles: TicketStyle[] = ["props_heavy", "balanced", "favorites", "longshots"];
  const out: BuiltTicket[] = [];
  const usedFingerprints = new Set<string>();

  for (const style of styles) {
    const t = packTicket(pool, target, style);
    if (!t) continue;
    const fp = t.legs.map((l) => l.player + l.prop).sort().join("|");
    if (usedFingerprints.has(fp)) continue;
    usedFingerprints.add(fp);
    out.push(t);
    if (out.length >= 4) break;
  }
  return out;
}

export default function PulseMultipliersPage() {
  const [selectedSports, setSelectedSports] = useState<string[]>(["MLB", "WNBA"]);
  const [activeBucket, setActiveBucket] = useState<number | null>(null);
  const [phase, setPhase] = useState<"pick" | "sports" | "loading" | "results">("pick");
  const [tickets, setTickets] = useState<BuiltTicket[]>([]);

  function toggleSport(key: string, available: boolean) {
    if (!available) return;
    setSelectedSports((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]
    );
  }

  function startBucket(n: number) {
    setActiveBucket(n);
    setPhase("sports");
    setTickets([]);
  }

  function runBuild() {
    if (!activeBucket || selectedSports.length === 0) return;
    setPhase("loading");
    // Brief delay so the hourglass moment is visible
    setTimeout(() => {
      const built = buildAll(selectedSports, activeBucket);
      setTickets(built);
      setPhase("results");
    }, 1400);
  }

  function reset() {
    setPhase("pick");
    setActiveBucket(null);
    setTickets([]);
  }

  const availableNote = useMemo(() => {
    const a = SPORTS.filter((s) => s.available).map((s) => s.key);
    return a.join(" · ");
  }, []);

  return (
    <div className="min-h-screen">
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center font-bold text-zinc-950 text-lg">
                P
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">ParlayPulse</h1>
                <p className="text-xs text-zinc-500">Pulse Multipliers</p>
              </div>
            </Link>
            <nav className="hidden md:flex gap-3 text-sm flex-wrap">
              <Link href="/" className="text-zinc-400 hover:text-white">Ticket Health</Link>
              <Link href="/futures-ticket-health" className="text-zinc-400 hover:text-white">Futures</Link>
              <Link href="/save-the-unit" className="text-zinc-400 hover:text-white">Save the Unit</Link>
              <Link href="/prop-watch" className="text-zinc-400 hover:text-white">Prop Watch</Link>
              <Link href="/pulse-multipliers" className="text-emerald-400 font-medium">Multipliers</Link>
            </nav>
          </div>
          <span className="text-[10px] uppercase tracking-wider text-amber-400/90 border border-amber-500/30 rounded-full px-2 py-0.5">
            Highest tier
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <section className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
          <h2 className="text-xl font-semibold">Pulse Multipliers</h2>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
            Pick a target multiple. Choose sports. We build several ticket shapes from
            PropFinder-ranked props (PF rating, streak, recent hit rates) aimed at that payout
            band.
          </p>
          <p className="text-xs text-zinc-600 mt-2">
            Data loaded: {availableNote}. NFL/NBA/NHL/MLS unlock when you drop in weekly CSVs.
          </p>
          <p className="text-[11px] text-zinc-600 mt-2 border-t border-zinc-800 pt-2">
            Not advisors. This tool only uses our internal prop dataset and ranking rules to
            assemble tickets — not guarantees, not personal advice.
          </p>
        </section>

        {/* Buckets */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {BUCKETS.map((b) => {
            const on = activeBucket === b.key;
            return (
              <button
                key={b.key}
                type="button"
                onClick={() => startBucket(b.key)}
                className={`rounded-2xl border p-5 text-left transition min-h-[120px] ${
                  on
                    ? "border-emerald-500/60 bg-emerald-500/10"
                    : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-600"
                }`}
              >
                <div className="text-3xl font-bold text-white">{b.label}</div>
                <div className="text-xs text-zinc-500 mt-2">{b.desc}</div>
              </button>
            );
          })}
        </section>

        {/* Sport select */}
        {(phase === "sports" || phase === "loading" || phase === "results") && (
          <section className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">
                Sports for {activeBucket}x
              </h3>
              {phase !== "loading" && (
                <button type="button" onClick={reset} className="text-xs text-zinc-500 hover:text-white">
                  Start over
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {SPORTS.map((s) => {
                const on = selectedSports.includes(s.key);
                return (
                  <button
                    key={s.key}
                    type="button"
                    disabled={!s.available || phase === "loading"}
                    onClick={() => toggleSport(s.key, s.available)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                      !s.available
                        ? "border-zinc-800 text-zinc-600 cursor-not-allowed"
                        : on
                        ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                        : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
                    }`}
                  >
                    {s.key}
                    {!s.available && " · soon"}
                  </button>
                );
              })}
            </div>
            {phase === "sports" && (
              <button
                type="button"
                disabled={selectedSports.length === 0}
                onClick={runBuild}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-sm font-medium px-5 py-2.5 rounded-lg"
              >
                Build {activeBucket}x options
              </button>
            )}
          </section>
        )}

        {/* Loading */}
        {phase === "loading" && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 flex flex-col items-center justify-center min-h-[160px]"
              >
                <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
                <p className="text-xs text-zinc-500 mt-3">Building option {i}…</p>
              </div>
            ))}
          </section>
        )}

        {/* Results */}
        {phase === "results" && (
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-zinc-400 px-1">
              {tickets.length} options near {activeBucket}x · {selectedSports.join(", ")}
            </h3>
            {tickets.length === 0 && (
              <p className="text-sm text-zinc-500">
                Not enough props in the selected sports to build tickets. Try adding MLB or WNBA.
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tickets.map((t, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold">{t.title}</div>
                      <div className="text-[11px] text-zinc-500">{t.subtitle}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-emerald-400 tabular-nums">
                        ~{t.approxMult}x
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono">
                        {t.combinedAmerican}
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-0.5 tabular-nums">
                        ~{(t.hitProb * 100).toFixed(1)}% mkt hit
                      </div>
                    </div>
                  </div>
                  <ul className="divide-y divide-zinc-800/80">
                    {t.legs.map((leg, i) => (
                      <li key={i} className="px-4 py-2.5 text-sm">
                        <div className="flex justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-medium truncate">
                              {leg.player}{" "}
                              <span className="text-zinc-500 font-normal text-xs">
                                {leg.team} · {leg.sport}
                              </span>
                            </div>
                            <div className="text-xs text-emerald-400/90">{leg.prop}</div>
                            <div className="text-[10px] text-zinc-600">
                              PF {leg.rating} · streak {leg.streak} · L5 {leg.l5} · L10 {leg.l10}
                            </div>
                          </div>
                          <div className="text-xs font-mono text-zinc-300 shrink-0">
                            {leg.odds > 0 ? `+${leg.odds}` : leg.odds}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-zinc-500 text-center pt-2 max-w-2xl mx-auto leading-relaxed">
              ParlayPulse is not a sportsbook, tipster, or financial advisor. Tickets are
              generated by our internal algorithm from the prop research data we load (ratings,
              streaks, hit rates, and release odds). Market hit % is the product of each leg&apos;s
              implied probability from those odds — not a promise of results. Gamble responsibly.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
