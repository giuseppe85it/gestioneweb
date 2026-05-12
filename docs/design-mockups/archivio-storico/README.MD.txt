# Archivio Storico — Mockup di riferimento

Versione: v2 (10 maggio 2026)
Sorgente: Claude Design (claude.ai/design)
Stato: APPROVATO da Giuseppe come riferimento visivo per
l'implementazione del modulo NEXT.

## Cosa è
Mockup HTML standalone del modulo "Archivio Storico" che vivrà
come nuova tab pagina dentro il Centro Controllo NEXT, a fianco
di "Sinottica Flotta v2".

## Aprire il mockup
Aprire `Archivio_Storico_v2.html` direttamente in un browser
moderno (Chrome/Edge/Firefox). Il file è quasi standalone — se
il rendering colori/font sembra rotto, manca `colors_and_type.css`
che era linked esternamente nel pacchetto Claude Design originale.

## Decisioni di scope (approvate da Giuseppe)
- 4 sub-tab: Lavori · Manutenzioni · Segnalazioni · Richieste
- Filtri globali sticky: Autista · Targa · Cerca (testo libero)
  · Periodo (default Ultimi 30 giorni, prolungabile senza limiti)
- Toggle densità lista: Comoda · Compatta
- Click sulla riga = espande inline con dettagli aggiuntivi
- Foto mezzo come colonna 64x48 (pattern Sinottica V2)
- Mini-timeline orizzontale eventi (Aperta · Presa · Chiusa · Lavoro generato)
- Solo lettura, niente azioni operative
- Niente limite temporale (nessun "ultimi 24 mesi")

## Da implementare in fase Claude Code (NON nel mockup)
- Ricerca testuale scoped sulla sub-tab corrente, con contatori
  dinamici per le altre tab che mostrano i match con la query
  attuale (modalità "C ibrido" decisa da Giuseppe).
- Lettura dati reale da Firestore (oggi nel mockup sono dati finti
  — targhe, autisti, conteggi sono solo esempi visivi).
- Mapping campi UI ↔ campi reali dei type proiezione NEXT
  (NextLavoroReadOnlyItem, NextMaintenanceHistoryItem,
  NextAutistiSegnalazioneSectionItem, NextAutistiRichiestaSectionItem).
- Anti-invenzione: la card espansa del mockup mostra campi
  plausibili ma alcuni potrebbero NON esistere nei type reali
  (es. "note officina", "n. fattura", "km al rientro"). Lo SPEC
  mapperà solo i campi audit-confermati.

## Riferimento incrociato
- Audit: `docs/audit/2026-05-11_AUDIT_ARCHIVIO_STORICO_NEXT.md`
- SPEC (da scrivere): `docs/product/SPEC_ARCHIVIO_STORICO_NEXT.md`