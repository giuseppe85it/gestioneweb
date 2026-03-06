# NUOVA STRUTTURA GESTIONALE

Blueprint pratico della nuova applicazione (target), coerente con:
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/ui-redesign/sitemap_proposed.md`
- `docs/ui-redesign/dossier_convergence_map.md`
- `docs/diagrams/flows_data_contract.md`

## Legenda stato
- **[CONFERMATO]**: comportamento/asset gia dimostrato nel repository.
- **[RACCOMANDAZIONE]**: target architetturale da implementare.
- **[DA VERIFICARE]**: punto aperto non chiuso da evidenza univoca.

---

## 1) Home / Centro di Controllo
- **Cosa contiene** [RACCOMANDAZIONE]:
  - Priorita oggi, code operative, azioni rapide, ricerca globale.
- **Perche esiste** [RACCOMANDAZIONE]:
  - Essere il punto unico da cui governare il giorno operativo.
- **Cosa collega** [CONFERMATO+RACCOMANDAZIONE]:
  - Lavori, eventi autisti, dossier, acquisti, alert, PDF.
- **Cosa mostra all'utente** [RACCOMANDAZIONE]:
  - Stato sintetico + drill-down immediato per record critici.

## 2) Flotta
- **Cosa contiene** [CONFERMATO]:
  - Anagrafica mezzi, pianificazione manutenzioni, monitor stato mezzo.
- **Perche esiste** [CONFERMATO]:
  - Governare il ciclo vita mezzi a livello globale.
- **Cosa collega** [RACCOMANDAZIONE]:
  - Ogni mezzo deve avere ponte diretto al Dossier Mezzo.
- **Cosa mostra all'utente** [RACCOMANDAZIONE]:
  - Vista per categoria/stato + KPI sintetici per targa.

## 3) Dossier Mezzo
- **Cosa contiene** [RACCOMANDAZIONE]:
  - Timeline mezzo, lavori, manutenzioni, rifornimenti, materiali, documenti IA, costi, PDF.
- **Perche esiste** [RACCOMANDAZIONE]:
  - Ridurre la frammentazione delle viste mezzo-centriche.
- **Cosa collega** [CONFERMATO+RACCOMANDAZIONE]:
  - Flotta, analisi, autisti, documenti, centro controllo.
- **Cosa mostra all'utente** [RACCOMANDAZIONE]:
  - Stato completo e decisionabile del singolo mezzo.

## 4) Operativita
- **Cosa contiene** [CONFERMATO]:
  - Workflow lavori e gestione operativa giornaliera.
- **Perche esiste** [CONFERMATO]:
  - Separare orchestrazione task dal dominio economico/magazzino.
- **Cosa collega** [RACCOMANDAZIONE]:
  - Centro controllo, Dossier, Magazzino.
- **Cosa mostra all'utente** [RACCOMANDAZIONE]:
  - Task aperti, priorita, blocchi e avanzamento.

## 5) Magazzino
- **Cosa contiene** [CONFERMATO]:
  - Inventario, movimenti materiali, consegne, attrezzature cantieri.
- **Perche esiste** [CONFERMATO]:
  - Dominio trasversale non confinabile a una sola targa.
- **Cosa collega** [CONFERMATO]:
  - Operativita, Dossier (viste derivate), Acquisti.
- **Cosa mostra all'utente** [RACCOMANDAZIONE]:
  - Disponibilita, movimenti, alert giacenze.

## 6) Analisi
- **Cosa contiene** [CONFERMATO+RACCOMANDAZIONE]:
  - Analisi economica mezzo, trend gomme/rifornimenti/costi.
- **Perche esiste** [RACCOMANDAZIONE]:
  - Trasformare dati operativi in decisione economica.
- **Cosa collega** [CONFERMATO]:
  - Dossier Mezzo, documenti IA, costi manuali/canonici.
- **Cosa mostra all'utente** [RACCOMANDAZIONE]:
  - KPI, anomalie, confronto periodo, export.

## 7) Autisti
- **Cosa contiene** [CONFERMATO]:
  - App campo (`/autisti/*`) + inbox/rettifica admin (`/autisti-inbox/*`, `/autisti-admin`).
- **Perche esiste** [CONFERMATO]:
  - Separare esperienza campo da esperienza ufficio.
- **Cosa collega** [CONFERMATO+DA VERIFICARE]:
  - Flussi verso eventi operativi, segnalazioni, rifornimenti, controlli.
  - Stream canonico eventi ancora da consolidare.
- **Cosa mostra all'utente** [RACCOMANDAZIONE]:
  - In campo: task essenziali, zero frizioni.
  - In admin: monitoraggio, rettifica, presa in carico.

## 8) Sistema / Supporto
- **Cosa contiene** [CONFERMATO]:
  - `storageSync`, `homeEvents`, `pdfEngine`, `pdfPreview`, `aiCore`, funzioni backend, configurazioni IA.
- **Perche esiste** [CONFERMATO]:
  - Ridurre duplicazioni infrastrutturali tra moduli.
- **Cosa collega** [CONFERMATO]:
  - Tutte le aree applicative.
- **Cosa mostra all'utente** [RACCOMANDAZIONE]:
  - Quasi nulla in UI business; accessi tecnici controllati.

## 9) IA (capability trasversale)
- **Stato attuale** [CONFERMATO]:
  - IA documentale e libretti in area dedicata; analisi economica IA; pipeline cisterna specialistica.
- **Target** [RACCOMANDAZIONE]:
  - IA visibile in ogni area dove porta valore, non come silo separato.
- **Vincolo** [DA VERIFICARE]:
  - Chiusura governance endpoint multipli (`aiCore`, `estrazioneDocumenti`, pipeline cisterna, endpoint Vercel non dimostrato).

## 10) PDF (capability trasversale)
- **Stato attuale** [CONFERMATO]:
  - `pdfEngine` usato in molte pagine per anteprima/export/share.
- **Target** [RACCOMANDAZIONE]:
  - Un unico comportamento PDF cross-modulo (naming, UX, canali di condivisione).
- **Vincolo** [CONFERMATO]:
  - Evitare motori alternativi o duplicazioni.

---

## Collegamenti architetturali obbligatori (target)
1. Home/Centro Controllo -> tutte le aree.
2. Flotta -> Dossier Mezzo (accesso diretto per targa).
3. Operativita/Magazzino -> Dossier tramite record targa-correlati.
4. Autisti -> Centro Controllo + Dossier/360 tramite stream eventi.
5. IA e PDF -> capability trasversali (non moduli isolati).

## Punti aperti da chiudere prima della fase patch ampia
- Route canonica dossier e dettaglio ordini.
- Stream eventi autisti canonico.
- Matrice permessi ruoli (admin/capo/autista).
- Contratto definitivo allegati preventivi.

