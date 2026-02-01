import type { Lavoro } from "../types/lavori";

export function isLavoroInAttesaGlobal(lavoro: Lavoro): boolean {
  return lavoro.eseguito !== true;
}

export function isLavoroEseguito(lavoro: Lavoro): boolean {
  return lavoro.eseguito === true;
}
