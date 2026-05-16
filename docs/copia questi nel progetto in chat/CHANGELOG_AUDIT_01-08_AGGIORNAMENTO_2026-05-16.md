# CHANGELOG — Aggiornamento audit 01-08 al 2026-05-16

**Data:** 2026-05-16 · **PROMPT:** 55 · **Tipo:** aggiornamento documentale in-place, lettura codice + audit storici.

## Premessa metodologica

Gli 8 file audit `01..08` prodotti il 2026-05-07 sono organizzati come **package handoff** nella cartella [docs/audit/2026-05-07_mappa_next_flussi_dati/](../audit/2026-05-07_mappa_next_flussi_dati/). L'indice del package (`00_INDICE_REPORT.md`) dichiara esplicitamente:

- File 01, 02, 03 sono **copie congelate** di originali che vivono in `docs/audit/`, `docs/data/`, `docs/architecture/`.
- File 04, 05, 06, 07, 08 sono **originali nati nel package**.

Per PROMPT 55: aggiornati gli **8 originali**, lasciate intatte le 3 copie handoff di 01/02/03 + l'indice `00_INDICE_REPORT.md` (per esplicita istruzione del prompt: "i file `0?_` in handoff sono copie congelate per consultazione rapida, non vanno toccati").

Ogni file aggiornato porta in testa:
- Riga data modificata: `Data originale: 2026-05-07 — Aggiornato: 2026-05-16`.
- Sezione **"Aggiornamento 2026-05-16"** con sub-sezioni `[NUOVO]` / `[AGGIORNATO]` / `[OBSOLETO]` e riferimenti `path:riga` o decisione `DIARIO_DECISIONI` datata.
- Marker `[OBSOLETO 2026-05-16: <motivo>]` inline sulle righe singole ora false (le righe NON sono cancellate, restano per memoria storica).

## File toccati

### 01 — AUDIT REALE MODULI NEXT, COLLEZIONI, READER/WRITER E FLUSSI DATI

Path: [docs/audit/AUDIT_REALE_MODULI_NEXT_COLLEZIONI_FLUSSI_2026-05-07.md](../audit/AUDIT_REALE_MODULI_NEXT_COLLEZIONI_FLUSSI_2026-05-07.md)

- `[OBSOLETO]` Modulo Lavori NEXT come scrivente — dismesso (J.1–J.11, override J.10) il 2026-05-12/13/14; sidebar voce rimossa; route `/next/lavori-*` redirect compat a `/next/manutenzioni`; strategia 3a su `@lavori`.
- `[AGGIORNATO]` Manutenzioni NEXT — nuovi stati (`daFare`/`programmata`/`eseguita`/`chiusa_da_evento`); macchina chiusura ciclo eventi; aggancio retroattivo `gomme_evento`; semantica `linkedLavoroId` → `@manutenzioni` (decisione J.7).
- `[NUOVO]` Modulo Archivio Storico in CC — `src/next/centroControllo/archivioStorico/` 22 file (PROMPT 29.0 → 31.2 chiusura 2026-05-12).
- `[NUOVO]` Modulo Scadenze Collaudi scrivente `/next/scadenze-collaudi` (decisione 2026-04-30 — già presente al 2026-05-07 ma da censire esplicitamente).
- `[AGGIORNATO]` Chat IA NEXT V1 chiusa 100% (5 viste certificate, Zero-Invenzioni, Blocco 8 chiuso, Playwright 17-21 PASS 10/10) — riferimento 2026-05-06.
- `[AGGIORNATO]` Centro di Controllo NEXT torre operativa — 4 nuovi scope barrier + soft-delete pattern + hard-delete mezzo (decisione 2026-05-09).
- `[NUOVO]` Helper `frasestoriaRecord.ts` + componente `FraseStoriaRecord`; `dateUnica.ts` come fonte unica formato date.
- Marker inline `[OBSOLETO 2026-05-16: ...]` su 4 righe tabella sezione 0 (Lavori NEXT) e 1 riga tabella sezione 1.

Conteggio: 1 OBSOLETO sezione + 6 AGGIORNATI/NUOVI in sezione "Aggiornamento 2026-05-16" + 5 marker inline.

### 02 — DATA CONTRACT REALE NEXT FIREBASE

Path: [docs/data/DATA_CONTRACT_REALE_NEXT_FIREBASE_2026-05-07.md](../data/DATA_CONTRACT_REALE_NEXT_FIREBASE_2026-05-07.md)

- `[NUOVO]` Campi su dataset esistenti: `chiusuraDi/chiusuraRefId/chiusuraData` su 3 collection; stato `chiusa_da_evento` / `chiusa` ammesso; `nascostoInArchivio: boolean` su 4 collezioni Archivio; `manutenzioneContrattoAttivo: boolean` su `@mezzi_aziendali`; campi soft-delete `chiusa/chiuso/evasa + dataChiusura/dataEvasione + *_by`.
- `[AGGIORNATO]` `@manutenzioni.data` ora ISO `yyyy-mm-dd` (migration 56 record); `linkedLavoroId` semantica → `@manutenzioni` (J.7); `dataPresaInCarico` solo via `segnaPresaInCaricoSegnalazione` (regola permanente `TIMESTAMP-MAI-DA-CLICK`).
- `[NUOVO]` 9 writer NEXT business: `markSegnalazioneChiusa`, `markControlloChiuso`, `markRichiestaEvasa`, `nextChiusuraEventoWriter.*`, `agganciaSegnalazioneAManutenzioneEsistente`, `sganciaLegameOrfano`, `segnaPresaInCaricoSegnalazione`, `createManutenzioneDaFareFrom*`, `nextMezzoHardDeleteWriter`, `nextRifornimentiWriter`.
- `[NUOVO]` 5 helper: `cicloLegame.ts`, `closureOrchestrator.ts`, `dateUnica.ts`, `frasestoriaRecord.ts`, `eventiCompatibili.ts`, `manutenzioniPerAggancio.ts`, `manutenzioniCandidatiMerge.ts`.
- `[OBSOLETO]` Writer Lavori NEXT (`@lavori`) — dismessi 2026-05-12.
- `[NUOVO]` Registro Collection Firestore v1.0 STABLE (2026-05-06); 7 punti decisioni 2026-05-04 (3-4 ancora aperti).
- Marker inline `[OBSOLETO 2026-05-16: ...]` su 1 riga tabella sezione 1 (`@lavori`) + 2 righe tabella sezione 2 (Lavori da eseguire / Dettaglio lavoro).

Conteggio: 1 sezione OBSOLETO + 10+ AGGIORNATI/NUOVI + 3 marker inline.

### 03 — DIAGRAMMI FLUSSI DATI NEXT

Path: [docs/architecture/DIAGRAMMI_FLUSSI_DATI_NEXT_2026-05-07.md](../architecture/DIAGRAMMI_FLUSSI_DATI_NEXT_2026-05-07.md)

- `[OBSOLETO]` Diagrammi che mostrano `@lavori` come fonte attiva scritta da NEXT (sezioni 1, 7, 12) — dismissione 2026-05-12.
- `[AGGIORNATO]` Sezione 2 — incluso `closureOrchestrator` + stati nuovi su `@manutenzioni`.
- `[NUOVO]` Diagramma Mermaid "Macchina chiusura ciclo eventi" (`chiusa_da_evento`, aggancio retroattivo `gomme_evento`).
- `[AGGIORNATO]` Sezione 6 — writer NEXT business attivi (markSegnalazioneChiusa, markControlloChiuso, hard-delete cascade); `NextHomeAutistiEventoModal` autonomo (PROMPT 28).
- `[AGGIORNATO]` Sezione 11 Chat IA — V1 chiusa 100%, 5 viste certificate, `resolvedFilters.v2`.
- `[NUOVO]` Sidebar NEXT senza voce "Lavori" (PROMPT 23-25).
- Annotazione `[AGGIORNATO 2026-05-16: ...]` aggiunta in fondo a sezione 12.

Conteggio: 1 nuovo diagramma Mermaid + 4 sezioni con delta segnalati + 1 annotazione inline finale.

### 04 — AUDIT CHIUSURA PUNTI DA VERIFICARE NEXT

Path: [docs/audit/2026-05-07_mappa_next_flussi_dati/04_AUDIT_CHIUSURA_DA_VERIFICARE_NEXT.md](../audit/2026-05-07_mappa_next_flussi_dati/04_AUDIT_CHIUSURA_DA_VERIFICARE_NEXT.md)

- `[AGGIORNATO]` DV-33 Autisti NEXT writer reale — perimetro ridotto da 4 scope barrier 2026-05-09; resta madre montata su `/next/autisti-admin`.
- `[AGGIORNATO]` DV-22 `@preventivi_approvazioni` writer NEXT — invariato (rischio reale, writer madre).
- `[AGGIORNATO]` DV-24 `@analisi_economica_mezzi` writer NEXT — invariato + decisione 2026-05-04 punto 5 "esclusa by design".
- `[AGGIORNATO]` DV-20 / DV-21 rules — invariati come stato; mitigazione barrier client-side 15+ scope.
- `[AGGIORNATO]` DV-27 / DV-28 hotspot/foto viste — decisione 2026-05-04 punto 7 aperta.
- `[NUOVO]` Regola permanente `AUDIT-CERCA-PER-TARGA` ([AGENTS.md:213-231](../../AGENTS.md#L213-L231)) derivata da PROMPT 46.
- `[NUOVO]` Regola permanente `TIMESTAMP-MAI-DA-CLICK` ([AGENTS.md:235-276](../../AGENTS.md#L235-L276)) derivata da PROMPT 50.
- `[NUOVO]` 3 punti audit-only aperti: whitelist categorie unificata, hard-delete fallback `mezzoId`, aggregator badge gomme Sinottica.

Conteggio: 5 AGGIORNATI + 5 NUOVI.

### 05 — AUDIT AUTISTI MADRE NEXT IMPORT DEFINITIVO

Path: [docs/audit/2026-05-07_mappa_next_flussi_dati/05_AUDIT_AUTISTI_MADRE_NEXT_IMPORT_DEFINITIVO.md](../audit/2026-05-07_mappa_next_flussi_dati/05_AUDIT_AUTISTI_MADRE_NEXT_IMPORT_DEFINITIVO.md)

- `[AGGIORNATO]` Conclusione operativa originale — parzialmente superata; `NextAutistiAdminNative.tsx` con scope CC dedicati esiste ma non sostituisce ancora la madre come pagina. Proposta NEXT 6 fasi in `AUDIT_NEXT_COMPLETO_2026-05-16.md` cap. 5.3.
- `[NUOVO]` `NextHomeAutistiEventoModal` autonomo (PROMPT 28, 2026-05-14) — scrive `@manutenzioni daFare` via `createManutenzioneDaFareFromEvento`.
- `[NUOVO]` Writer NEXT business attivi via decisione 2026-05-09 (Centro Controllo torre operativa).
- `[NUOVO]` Eccezioni permanenti formalizzate (opzione α, strategia 3a, madre intoccabile, decisione J.7).
- `[OBSOLETO]` Sezione "Cosa manca per import definitivo" punto 1 — risolto da scope 2026-05-09. Restano aperti punti 2-6.
- Marker inline `[AGGIORNATO 2026-05-16: ...]` in chiusura sezione "Stato finale Autisti".

Conteggio: 2 AGGIORNATI + 3 NUOVI + 1 OBSOLETO + 1 marker inline.

### 06 — DIAGRAMMI AUTISTI E PUNTI APERTI

Path: [docs/audit/2026-05-07_mappa_next_flussi_dati/06_DIAGRAMMI_AUTISTI_E_PUNTI_APERTI.md](../audit/2026-05-07_mappa_next_flussi_dati/06_DIAGRAMMI_AUTISTI_E_PUNTI_APERTI.md)

- `[AGGIORNATO]` Sezioni 3, 4, 6, 7 — il flusso "NEXT no-op managed key" è superato per il lato Centro Controllo (writer business attivi via scope dedicati).
- `[NUOVO]` Diagramma Mermaid "Flusso CC Marca chiusa/chiuso/evasa + hard-delete" (decisione 2026-05-09).
- `[NUOVO]` Diagramma Mermaid "Flusso aggancio inverso PROMPT 47" (sgancio orfano + propagazione chiusura).
- `[AGGIORNATO]` Sezione 11 "Punti DA VERIFICARE rimasti" — punto Autisti NEXT writer ora parziale; aggiunte regole permanenti.

Conteggio: 4 AGGIORNATI + 2 NUOVI diagrammi.

### 07 — SINTESI OPERATIVA PER GIUSEPPE

Path: [docs/audit/2026-05-07_mappa_next_flussi_dati/07_SINTESI_OPERATIVA_PER_GIUSEPPE.md](../audit/2026-05-07_mappa_next_flussi_dati/07_SINTESI_OPERATIVA_PER_GIUSEPPE.md)

- `[AGGIORNATO]` Sez. 1 "Cosa è chiaro nella NEXT" — aggiungere Centro Controllo torre operativa, Archivio Storico chiuso, Manutenzioni post-Lavori-dismissione, Chat IA V1 chiusa, date unificate, regole permanenti.
- `[AGGIORNATO]` Sez. 5 "Stato Autisti madre/NEXT" — come 05.
- `[AGGIORNATO]` Sez. 8 "Cosa non toccare senza audit mirato" — formalizzazione opzione α, strategia 3a, madre intoccabile.
- `[AGGIORNATO]` Sez. 9 "Documenti da leggere in ordine" — `AUDIT_NEXT_COMPLETO_2026-05-16.md` in cima.
- `[NUOVO]` Raccomandazione Chat IA (cap. 7 audit 2026-05-16): tenere operativa a perimetro chiuso.

Conteggio: 4 AGGIORNATI + 1 NUOVO.

### 08 — AUDIT FIRESTORE / STORAGE RULES NEXT

Path: [docs/audit/2026-05-07_mappa_next_flussi_dati/08_AUDIT_FIRESTORE_STORAGE_RULES_NEXT.md](../audit/2026-05-07_mappa_next_flussi_dati/08_AUDIT_FIRESTORE_STORAGE_RULES_NEXT.md)

- `[NUOVO]` 4 scope barrier CC torre operativa (2026-05-09): `RIFORNIMENTI`/`SEGNALAZIONI`/`CONTROLLI`/`RICHIESTE_WRITE_SCOPE`.
- `[NUOVO]` `DELETE_MEZZO_WRITE_SCOPE` — hard-delete cascade 11 storage keys.
- `[NUOVO]` `MANUTENZIONE_DAFARE_CREATE_WRITE_SCOPE`.
- `[NUOVO]` `CHIUSURA_DA_EVENTO_WRITE_SCOPE` (macchina chiusura ciclo eventi 2026-05-14).
- `[NUOVO]` `CENTRO_CONTROLLO_LEGAME_WRITE_SCOPE` (PROMPT 47/48).
- `[NUOVO]` `ARCHIVIO_HIDE_WRITE_SCOPE` (PROMPT 31.1).
- `[AGGIORNATO]` Matrice "Moduli NEXT - rules" — server-side invariata; client-side mitigata dai 15+ scope; `cloneWriteBarrier.ts` ora ~985 righe.
- `[AGGIORNATO]` R-CRIT-01 / R-CRIT-04 — invariati server-side, mitigati client-side dai nuovi scope.
- `[NUOVO]` Decisioni 2026-05-04 post-audit modali — 7 punti decisi, 3-4 ancora aperti.
- **VERIFICA NON ESEGUITA**: `firestore.rules` e `storage.rules` effettivi non riletti in questo turno. Le sezioni 4, 5, 7, 10 originali restano la fotografia disponibile. Se le rules non sono cambiate dopo il 2026-05-07 (non risultano interventi in `DIARIO_DECISIONI`), la fotografia resta valida.

Conteggio: 6 NUOVI scope + 3 AGGIORNATI + 1 VERIFICA NON ESEGUITA dichiarata.

## File invariati

Nessuno. Tutti gli 8 file 01-08 hanno ricevuto almeno la sezione "Aggiornamento 2026-05-16" + nuova riga data.

## Verifiche non eseguite

- **`firestore.rules` e `storage.rules` reali al 2026-05-16**: non riletti in questo turno (fuori scope modifica). Se Giuseppe vuole conferma che le sezioni 4/5/7/10 del file 08 sono ancora valide, serve una rilettura mirata di quei file. Dato che `DIARIO_DECISIONI.md` non riporta interventi su rules tra 2026-05-08 e 2026-05-16, l'ipotesi è che siano invariate.
- **UI runtime di `NextEuromeccPage.tsx` 5 tab + 3 tipi issue**: come segnalato in `AUDIT_NEXT_COMPLETO_2026-05-16.md` cap. 3, audit statico — non riverificato qui.
- **Editor hotspot foto mezzo runtime**: presente in domain `nextMappaStoricoDomain.ts`, UI runtime non verificata.
- **Esistenza/uso runtime di alcuni writer e helper appena introdotti**: i writer (`markSegnalazioneChiusa`, `markControlloChiuso`, `nextChiusuraEventoWriter.*`, `agganciaSegnalazioneAManutenzioneEsistente`, `presaInCaricoSegnalazioneWriter`) sono confermati dal codice (letto nel PROMPT 54). L'effettivo utilizzo runtime in produzione (es. quante volte `markSegnalazioneChiusa` è stato invocato) non è verificabile da audit statico.
- **Cisterna NEXT writer e collection in registro Firestore**: decisione 2026-05-04 punto 2 ancora aperta. Stato corrente del registro v1.0 STABLE per Cisterna non riverificato in dettaglio in questo turno.

## Copie congelate non toccate

Per esplicita istruzione del PROMPT 55:

- [docs/audit/2026-05-07_mappa_next_flussi_dati/01_AUDIT_REALE_MODULI_NEXT_COLLEZIONI_FLUSSI.md](../audit/2026-05-07_mappa_next_flussi_dati/01_AUDIT_REALE_MODULI_NEXT_COLLEZIONI_FLUSSI.md) (copia di 01).
- [docs/audit/2026-05-07_mappa_next_flussi_dati/02_DATA_CONTRACT_REALE_NEXT_FIREBASE.md](../audit/2026-05-07_mappa_next_flussi_dati/02_DATA_CONTRACT_REALE_NEXT_FIREBASE.md) (copia di 02).
- [docs/audit/2026-05-07_mappa_next_flussi_dati/03_DIAGRAMMI_FLUSSI_DATI_NEXT.md](../audit/2026-05-07_mappa_next_flussi_dati/03_DIAGRAMMI_FLUSSI_DATI_NEXT.md) (copia di 03).
- [docs/audit/2026-05-07_mappa_next_flussi_dati/00_INDICE_REPORT.md](../audit/2026-05-07_mappa_next_flussi_dati/00_INDICE_REPORT.md) (indice del package).

Restano congelate alla data 2026-05-07 come consultazione rapida storica.

## Altri file correlati (non toccati)

- [docs/audit/AUDIT_FATTUALE_CENTRO_CONTROLLO_NEXT_2026-05-07.md](../audit/AUDIT_FATTUALE_CENTRO_CONTROLLO_NEXT_2026-05-07.md) e [docs/audit/AUDIT_CENTRO_CONTROLLO_AVANZATO_2026-05-07.md](../audit/AUDIT_CENTRO_CONTROLLO_AVANZATO_2026-05-07.md): audit Centro Controllo del 2026-05-07 fuori dal perimetro dei 01-08; non aggiornati in questo turno. Restano fonte storica del Centro Controllo prima della torre operativa 2026-05-09.
