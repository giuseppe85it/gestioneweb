export type Urgenza = "bassa" | "media" | "alta";

export type TipoLavoro = "magazzino" | "targa";

export interface SottoElemento {
  id: string;
  descrizione: string;
  quantita?: number;
  eseguito: boolean;
}

export interface Lavoro {
  id: string;
  gruppoId: string;
  tipo: TipoLavoro;
  descrizione: string;
  dataInserimento: string;
  eseguito: boolean;
  targa?: string;
  urgenza?: Urgenza;
  segnalatoDa?: string;
  chiHaEseguito?: string;
  dataEsecuzione?: string;
  sottoElementi: SottoElemento[] | unknown[];
}
