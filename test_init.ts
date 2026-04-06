import { createFreshState } from "./src/engine/factories";
import { generateRivalStables } from "./src/engine/rivals";
import { generatePromoters } from "./src/engine/promoters/promoterGenerator";
import { generateRecruitPool } from "./src/engine/recruitment";

const seed = 999;
const usedNames = new Set<string>();

console.log("[1] Start generateRivalStables");
const rivals = generateRivalStables(45, seed + 1);
console.log("[1] Done RIVALS");

console.log("[2] Start generatePromoters");
const promoters = generatePromoters(30, seed + 3);
console.log("[2] Done PROMOTERS");

console.log("[3] Start generateRecruitPool");
const recruitPool = generateRecruitPool(12, 1, usedNames, seed + 2);
console.log("[3] Done RECRUITS");
