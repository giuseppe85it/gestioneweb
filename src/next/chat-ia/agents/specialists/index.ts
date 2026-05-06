import { cantieriMagazzinoAgent } from "./cantieriMagazzinoAgent";
import { cisternaRifornimentiAgent } from "./cisternaRifornimentiAgent";
import { documentiAgent } from "./documentiAgent";
import { flottaAgent } from "./flottaAgent";
import { operazioniAgent } from "./operazioniAgent";

export const chatIaSpecialistAgents = [
  flottaAgent,
  operazioniAgent,
  documentiAgent,
  cisternaRifornimentiAgent,
  cantieriMagazzinoAgent,
] as const;

export {
  cantieriMagazzinoAgent,
  cisternaRifornimentiAgent,
  documentiAgent,
  flottaAgent,
  operazioniAgent,
};
