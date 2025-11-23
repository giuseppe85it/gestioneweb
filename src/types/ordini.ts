// src/types/ordini.ts

export type UnitaMisura = "pz" | "m" | "kg" | "lt" | string;

export interface MaterialeOrdine {
  id: string;
  descrizione: string;
  quantita: number;
  unita: UnitaMisura;
  arrivato: boolean;
  dataArrivo?: string; // "gg mm aaaa"
  fotoUrl?: string | null;
  fotoStoragePath?: string | null;
}

export interface Ordine {
  id: string;           // id interno
  idFornitore: string;  // es. codice o nome fornitore
  nomeFornitore: string;
  dataOrdine: string;   // "gg mm aaaa"
  materiali: MaterialeOrdine[];
}
export interface Ordine {
  id: string;
  idFornitore: string;
  nomeFornitore: string;
  dataOrdine: string;
  materiali: MaterialeOrdine[];

  arrivato: boolean;   //  ✅ AGGIUNTO
}
