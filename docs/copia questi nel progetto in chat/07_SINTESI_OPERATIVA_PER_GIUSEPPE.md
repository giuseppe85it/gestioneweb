# Sintesi operativa per Giuseppe

Data originale: 2026-05-07 — Aggiornato: 2026-05-16

## Aggiornamento 2026-05-16

Delta operativi dal 2026-05-08 al 2026-05-16. Origine: `DIARIO_DECISIONI.md` + `AUDIT_NEXT_COMPLETO_2026-05-16.md`. Per fotografia attuale completa vedi [docs/_live/AUDIT_NEXT_COMPLETO_2026-05-16.md](../../_live/AUDIT_NEXT_COMPLETO_2026-05-16.md).

- `[AGGIORNATO]` Sez. 1 "Cosa è chiaro nella NEXT" — da aggiungere:
  - **Centro di Controllo NEXT** ora è torre operativa (decisione 2026-05-09): scrive business reale via 7+ scope barrier (`RIFORNIMENTI`/`SEGNALAZIONI`/`CONTROLLI`/`RICHIESTE`/`DELETE_MEZZO`/`CHIUSURA_DA_EVENTO`/`CENTRO_CONTROLLO_LEGAME`/`MANUTENZIONE_DAFARE_CREATE`/`ARCHIVIO_HIDE`).
  - **Modulo Archivio Storico in CC** chiuso (PROMPT 29.0 → 31.2 il 2026-05-12), 22 file in `src/next/centroControllo/archivioStorico/`, 4 sub-tab (Lavori/Manutenzioni/Segnalazioni/Richieste).
  - **Manutenzioni NEXT** post-dismissione Lavori (J.1–J.11 + override J.10): nuovi stati `daFare`/`programmata`/`eseguita`/`chiusa_da_evento`; macchina chiusura ciclo eventi; aggancio retroattivo `gomme_evento`; closureOrchestrator propaga chiusura a sorgente collegata.
  - **Chat IA NEXT V1 CHIUSA al 2026-05-06** — 5 viste certificate (Driver360/Vehicle360/Site360/Euromecc360/Ricerca360); modalità Zero-Invenzioni; Blocco 8 chiuso (Playwright 17-21 PASS 10/10).
  - **Date NEXT unificate ISO** via helper `dateUnica.ts`; storia segnalazione unificata via `frasestoriaRecord.ts` + componente `FraseStoriaRecord` (PROMPT 49/52, 2026-05-14/15).
  - **Regole permanenti** in `AGENTS.md`: `AUDIT-CERCA-PER-TARGA` (PROMPT 46), `TIMESTAMP-MAI-DA-CLICK` (PROMPT 50).
- `[AGGIORNATO]` Sez. 5 "Stato Autisti madre/NEXT" — `NextAutistiAdminNative.tsx` ora scrive business reale via writer NEXT dedicati attivati da CC (decisione 2026-05-09). `/next/autisti-admin` continua però a montare `AutistiAdmin.tsx` madre come pagina principale. Proposta sostituzione NEXT in 6 fasi: vedi `AUDIT_NEXT_COMPLETO_2026-05-16.md` cap. 5.3. Taglia complessiva: L.
- `[AGGIORNATO]` Sez. 8 "Cosa non toccare senza audit mirato" — restano tutti i punti validi. Aggiungere esplicitamente: **opzione α** `src/components/AutistiEventoModal.tsx` shared con madre, **strategia 3a** `@lavori` Firestore intoccabile, **madre `src/pages/`** intoccabile (decisioni in `CLAUDE_CHAT_BEHAVIOR.md` sez. 6). I dataset `@preventivi_approvazioni`, `@analisi_economica_mezzi` restano fuori scope writer NEXT (decisione 2026-05-04 punto 5: `@analisi_economica_mezzi` esclusa by design dal motore generico).
- `[AGGIORNATO]` Sez. 9 "Documenti da leggere in ordine" — aggiungere prima di tutto: `docs/_live/AUDIT_NEXT_COMPLETO_2026-05-16.md` (fotografia attuale post-PROMPT 27 → 53).
- `[NUOVO]` Raccomandazione esplicita Chat IA dall'audit 2026-05-16 (cap. 7): **tenere operativa a perimetro chiuso** (5 viste V1 + Zero-Invenzioni; manutenzione solo correttiva; niente nuove view o intent senza richiesta). Valore residuo unico: ricerca conversazionale libera + disambiguazione semantica. Decisione finale resta a Giuseppe.

## 1. Cosa e' chiaro nella NEXT

- Le route NEXT principali sono mappate in `src/App.tsx`.
- Centro Controllo NEXT usa la pagina parity e i reader NEXT reali: flotta, rifornimenti, autisti.
- Chat IA NEXT e Archivista/IA documentale sono moduli separati dai flussi Autisti.
- Archivista NEXT scrive documenti e preventivi in dataset documentali e Storage tramite client/bridge dedicati.
- Euromecc NEXT scrive relazioni, pending/done/issues e allegati nel proprio perimetro.
- Cisterna NEXT scrive documenti IA, schede IA e parametri mensili nel proprio perimetro.

## 2. Cosa resta da verificare

- Regole Firestore e Storage: oggi esiste un rischio reale di permessi larghi per signed-in.
- Autisti NEXT: le route ci sono, ma le scritture business ufficiali non sono attive; sono no-op o overlay locali.
- Contratti IA dinamici: i campi principali sono visibili nel codice, ma l'output IA completo non ha un tipo unico chiuso.
- `@preventivi_approvazioni`: NEXT legge e applica overlay locale, ma il writer reale resta in madre.
- `@analisi_economica_mezzi`: NEXT legge snapshot legacy, il writer reale trovato e' in madre.

## 3. Moduli sicuri da toccare lato UI

Sicuri solo lato UI/CSS se il task non cambia writer, reader, route o contratti dati:

- Centro Controllo parity.
- Pagine Autisti NEXT, con attenzione alle import CSS legacy.
- Pagine documentali IA, se la modifica e' solo layout/testo.
- Diagrammi/report/audit.

## 4. Moduli pericolosi lato dati

Richiedono audit mirato prima di patch:

- Autisti e Autisti Admin.
- Archivista/IA documentale.
- Cisterna IA e schede.
- Euromecc relazioni e ordini generati.
- Manutenzioni con scala inventario/materiali.
- Procurement/preventivi/listino.
- Dossier e analisi economica.
- Firestore/Storage rules.

## 5. Stato Autisti madre/NEXT

Madre Autisti: runtime business scrivente dimostrato. Scrive sessioni, storico, controlli, rifornimenti, segnalazioni, richieste, gomme, lavori e dossier rifornimenti.

NEXT Autisti: route e UI native/clone dimostrate, ma non import definitivo per scritture reali. In official runtime i managed dataset sono protetti da `nextAutistiStorageSync` e le scritture admin passano da bridge localStorage.

Conclusione: Autisti NEXT e' leggibile e navigabile, ma non sostituisce ancora la madre come runtime business scrivente.

## 6. Stato Archivista / IA documentale

Archivista/IA documentale e' mappato nei rami principali:

- documenti mezzi;
- documenti magazzino;
- preventivi;
- manutenzioni da documento;
- aggiornamento mezzi da libretto/documento;
- Cisterna IA e schede;
- Storage allegati.

Stato: PARZIALE per contratto completo, perche' alcuni payload dipendono da output IA dinamico.

## 7. Cosa non cancellare

- `backend/internal-ai/`, usato da chat e IA documentale.
- `src/next/internal-ai/Archivista*`.
- `src/next/autisti/nextAutistiStorageSync.ts`.
- `src/next/autistiInbox/nextAutistiAdminBridges.ts`.
- Dataset tmp Autisti, anche se non tutti sono writer NEXT reali.
- CSS legacy importati da NEXT finche' non esiste sgancio modulo per modulo.

## 8. Cosa non toccare senza audit mirato

- Rules Firestore/Storage.
- Writer Autisti NEXT.
- Consolidamento tmp Autisti verso dataset ufficiali.
- Contratti payload Archivista/Euromecc/Cisterna.
- `@preventivi_approvazioni`.
- `@analisi_economica_mezzi`.
- Writer `@costiMezzo`.

## 9. Documenti da leggere in ordine

1. `00_INDICE_REPORT.md`
2. `07_SINTESI_OPERATIVA_PER_GIUSEPPE.md`
3. `04_AUDIT_CHIUSURA_DA_VERIFICARE_NEXT.md`
4. `05_AUDIT_AUTISTI_MADRE_NEXT_IMPORT_DEFINITIVO.md`
5. `06_DIAGRAMMI_AUTISTI_E_PUNTI_APERTI.md`
6. `01_AUDIT_REALE_MODULI_NEXT_COLLEZIONI_FLUSSI.md`
7. `02_DATA_CONTRACT_REALE_NEXT_FIREBASE.md`
8. `03_DIAGRAMMI_FLUSSI_DATI_NEXT.md`
