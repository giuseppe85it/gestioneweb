import type { AnomalyType } from "../types/centroControlloTypes";

// Spiegazioni "per tutti" delle segnalazioni sui rifornimenti.
// Linguaggio volutamente semplice: niente termini tecnici, un esempio concreto per ognuna.
export type AnomaliaGuidaVoce = {
  type: AnomalyType;
  emoji: string;
  titolo: string;
  cosaVuolDire: string;
  esempio: string;
  cosaFare: string;
};

export const ANOMALIE_GUIDA: AnomaliaGuidaVoce[] = [
  {
    type: "CONSUMO_SOSPETTO_MEDIA_AUTISTA_TARGA",
    emoji: "⛽",
    titolo: "Consumo sospetto",
    cosaVuolDire:
      "Negli ultimi 4 rifornimenti questo mezzo, con questo autista, ha consumato parecchio di più del solito. Non guardiamo un singolo pieno (che inganna), ma la media degli ultimi 4 messi insieme.",
    esempio:
      "Di solito questo camion fa circa 3 km con un litro. Negli ultimi 4 pieni fa meno di 2 km con un litro: qualcosa è cambiato. Lo capisci dalla colonna «Media 4 rif.»: quando è bassa e colorata, scatta l'avviso.",
    cosaFare:
      "Non è un'accusa. Controlla cosa è cambiato di recente: percorsi più pesanti o in salita, più carico, modo di guidare, oppure un problema al mezzo. I rifornimenti parziali (rabbocchi piccoli o pieni grandi dopo pochi km) vengono esclusi dal conto, perché falserebbero la media. Serve un po' di storia (almeno 4 rifornimenti recenti e 8 prima): se ce n'è pochi, non segnaliamo nulla.",
  },
  {
    type: "KM_INVALIDI",
    emoji: "🔢",
    titolo: "Km mancanti o non validi",
    cosaVuolDire:
      "Su questo rifornimento manca il numero dei chilometri, oppure è zero. Senza i km non possiamo sapere quanta strada ha fatto il mezzo.",
    esempio:
      "È come segnare quanti litri hai messo, ma dimenticare di scrivere quanto segna il contachilometri.",
    cosaFare: "Controlla la ricevuta o chiedi all'autista e inserisci il numero di km giusto.",
  },
  {
    type: "KM_TORNANO_INDIETRO",
    emoji: "↩️",
    titolo: "Km che tornano indietro",
    cosaVuolDire:
      "I chilometri di questo rifornimento sono MENO di quelli del rifornimento precedente. Ma un mezzo non torna indietro nel contachilometri.",
    esempio:
      "La settimana scorsa il camion segnava 100.000 km, oggi segna 99.500. Impossibile: quasi sempre è un numero scritto male su uno dei due.",
    cosaFare: "Verifica quale dei due numeri è sbagliato e correggilo.",
  },
  {
    type: "KM_INVARIATI",
    emoji: "🟰",
    titolo: "Km uguali al precedente",
    cosaVuolDire:
      "I chilometri sono identici al rifornimento prima: il mezzo ha fatto gasolio ma il contachilometri non è cambiato per niente.",
    esempio:
      "Due rifornimenti in giorni diversi, tutti e due a 100.000 km esatti. O il km non è stato aggiornato, o è stato ricopiato per sbaglio.",
    cosaFare: "Controlla se il numero di km è giusto o è stato copiato dal rifornimento precedente.",
  },
  {
    type: "KM_SALTO_TROPPO_GRANDE",
    emoji: "🚀",
    titolo: "Salto di km troppo grande",
    cosaVuolDire:
      "Tra questo rifornimento e quello prima ci sono più di 1.200 km di differenza.",
    esempio:
      "Spesso NON è un errore. Vuol dire solo che è passato del tempo, o che manca un rifornimento in mezzo non registrato. E alcuni mezzi grandi (come il DAF) con un pieno solo fanno tranquillamente più di 1.200 km: per loro è del tutto normale.",
    cosaFare:
      "Controlla se manca un rifornimento o se quel mezzo fa davvero tanta strada con un pieno. Questa soglia verrà migliorata per tenere conto del tipo di mezzo.",
  },
  {
    type: "LITRI_NON_VALIDI",
    emoji: "🛢️",
    titolo: "Litri mancanti o non validi",
    cosaVuolDire: "Manca il numero dei litri messi, oppure è zero.",
    esempio: "È come dire «ho fatto gasolio» senza scrivere quanto ne hai messo.",
    cosaFare: "Inserisci i litri leggendoli dalla ricevuta.",
  },
  {
    type: "LITRI_TROPPO_ALTI",
    emoji: "📈",
    titolo: "Troppi litri in un colpo solo",
    cosaVuolDire:
      "In un solo rifornimento risultano più di 500 litri: davvero tanti per un pieno solo.",
    esempio:
      "Un serbatoio normale non tiene 500 e più litri tutti insieme. Spesso è un errore di battitura, per esempio 550 al posto di 55.",
    cosaFare: "Verifica il numero dei litri sulla ricevuta.",
  },
  {
    type: "LITRI_TROPPO_BASSI",
    emoji: "📉",
    titolo: "Troppo pochi litri",
    cosaVuolDire: "Meno di 20 litri: pochissimo per un camion.",
    esempio:
      "È come mettere mezzo bicchiere d'acqua in una damigiana. A volte manca uno zero, per esempio 8 al posto di 80.",
    cosaFare: "Controlla il numero dei litri.",
  },
];

export const getAnomaliaGuida = (type: AnomalyType): AnomaliaGuidaVoce | null =>
  ANOMALIE_GUIDA.find((voce) => voce.type === type) ?? null;
