# PROJECT MASTER BLUEPRINT

Versione: 2026-03-06  
Stato: Documento madre definitivo (fonte di verita architetturale del repository)

## Legenda stato (obbligatoria)
- **[CONFERMATO]**: dimostrato da file presenti nel repository (`docs/` e/o codice).
- **[DA VERIFICARE]**: tema aperto o incoerenza nota, non chiudibile con prova univoca.
- **[NON DIMOSTRATO]**: ipotesi non supportata dal repository.
- **[RACCOMANDAZIONE]**: scelta target proposta per la nuova app.

---

## 1. Visione del progetto
- **Cos'e GestioneManutenzione** [CONFERMATO]:
  - Gestionale operativo per flotta, lavori, manutenzioni, magazzino, acquisti, eventi autisti, documenti IA e output PDF.
  - Base tecnica attuale: SPA React + Firebase (Firestore, Storage, Functions), con area Autisti separata.
- **Problema che risolve** [CONFERMATO]:
  - Centralizzare processi oggi distribuiti: operativo giornaliero, costi per mezzo, documenti, storico eventi, consegne materiali.
- **Filosofia nuova app** [RACCOMANDAZIONE]:
  - Ridurre frammentazione UI e route duplicate.
  - Rendere la Home un vero Centro di Controllo.
  - Rendere il Dossier Mezzo il cuore operativo e analitico per targa.
  - Mantenere compatibilita progressiva con legacy fino a convergenza completata.

## 2. Ruoli fissi
- **Utente** [CONFERMATO]:
  - Fonte della realta operativa e delle regole business.
- **ChatGPT** [CONFERMATO]:
  - Ruolo CTO/architetto: definisce struttura, strategia, priorita e coerenza.
- **Codex** [CONFERMATO]:
  - Ruolo operaio: legge repo, verifica fatti, produce documentazione/patch su whitelist.

## 3. Architettura attuale
- **Panoramica** [CONFERMATO]:
  - Shell admin unica con moduli multipli (`/`, lavori, dossier/flotta, operativa, IA).
  - Shell autisti separata (`/autisti/*`) e shell inbox/rettifica admin autisti (`/autisti-inbox/*`, `/autisti-admin`).
  - Data layer ibrido:
    - `storage/<@key>` (pattern key-value via `setItemSync/getItemSync`)
    - collezioni dedicate (`@documenti_*`, `@impostazioni_app/gemini`, domini cisterna, ecc.).
- **Moduli principali** [CONFERMATO]:
  - Centro di Controllo, Flotta, Dossier, Operativita/Acquisti, Magazzino, Analisi, Autisti, IA/Cisterna, Supporto.
- **Criticita attuali** [CONFERMATO]:
  - Route duplicate legacy (`/dossiermezzi/:targa` vs `/dossier/:targa`, dettaglio ordini doppio).
  - Incoerenza eventi autisti (`autisti_eventi` vs `@storico_eventi_operativi`).
  - Pattern allegati preventivi multipli (`preventivi/ia/*` e `preventivi/{id}.pdf`).
  - Controlli ruolo admin/capo a livello route non dimostrati.

## 4. Architettura target della nuova app
- **Home / Centro di Controllo** [RACCOMANDAZIONE]:
  - Priorita giornaliere, code operative, azioni rapide, ricerca globale.
- **Flotta** [RACCOMANDAZIONE]:
  - Anagrafica mezzi, vista stato flotta, accesso rapido ai dossier.
- **Dossier Mezzo** [RACCOMANDAZIONE]:
  - Vista unificata per targa: lavori, manutenzioni, rifornimenti, documenti, costi, timeline.
- **Operativita** [RACCOMANDAZIONE]:
  - Lavori, workflow task, monitor operativo.
- **Magazzino** [RACCOMANDAZIONE]:
  - Inventario, movimenti, consegne, attrezzature cantieri.
- **Analisi** [RACCOMANDAZIONE]:
  - KPI economici mezzo/flotta, trend rifornimenti/gomme/costi.
- **Autisti** [RACCOMANDAZIONE]:
  - Area separata (app campo + inbox/rettifica admin).
- **Sistema / Supporto** [RACCOMANDAZIONE]:
  - Config, permessi, audit, strumenti tecnici.

## 5. Regola centrale
- **Home = Centro di Controllo** [RACCOMANDAZIONE]:
  - Nessun modulo critico deve restare isolato da alert e priorita.
- **Dossier Mezzo = cuore del sistema** [RACCOMANDAZIONE]:
  - Tutto cio che e targa-centrico converge qui.
- **Moduli globali separati** [RACCOMANDAZIONE]:
  - Acquisti, inventario, anagrafiche, sicurezza, configurazioni restano globali.
- **Nuova app parallela alla legacy** [CONFERMATO]:
  - Strategia documentata nelle decisioni: non sostituzione big-bang.
- **Partenza read-only** [CONFERMATO]:
  - Prima fase target con navigazione/consultazione e validazione dati senza nuove scritture invasive.

## 6. Cosa converge nel Dossier
- **Convergenza primaria (mezzo-centrica)** [RACCOMANDAZIONE]:
  - DossierMezzo, Mezzo360, sezioni gomme/rifornimenti.
  - Lavori (stato, backlog, esecuzioni).
  - Manutenzioni.
  - Analisi economica per targa.
  - Costi e documenti associati al mezzo.
  - Timeline eventi operativi collegati al mezzo.
- **Logica di convergenza** [RACCOMANDAZIONE]:
  - Ogni record con legame targa deve esporre navigazione verso Dossier.
  - Dossier non duplica i writer: aggrega, filtra, rende leggibile.

## 7. Cosa resta globale
- **Moduli globali strutturali** [CONFERMATO+RACCOMANDAZIONE]:
  - Acquisti/ordini/listino.
  - Inventario/materiali consegnati/attrezzature.
  - Anagrafiche colleghi/fornitori.
  - IA documentale intake multi-dominio.
  - Dominio cisterna specialistico.
  - Sistema, sicurezza, configurazioni, supporto tecnico.
- **Motivazione** [CONFERMATO]:
  - Questi moduli non sono confinati a una singola targa.

## 8. Dati / storage / chiavi / collezioni
- **Fonte completa**: `docs/data/DATA_MASTER_MAP.md` [CONFERMATO].
- **Vincolo architetturale** [CONFERMATO]:
  - Non cambiare naming key/collection senza piano di migrazione esplicito.
- **Incoerenze note da gestire in target** [CONFERMATO]:
  - Stream eventi autisti.
  - Route legacy.
  - Path allegati preventivi.

## 9. PDF
- **Regole trasversali** [CONFERMATO]:
  - PDF presenti in moduli multipli (lavori, dossier, centro controllo, acquisti, inbox autisti, analisi).
- **Da dove si generano** [CONFERMATO]:
  - Generazione locale tramite `pdfEngine` e pipeline di preview/share.
- **Come si usano** [CONFERMATO]:
  - Anteprima, export, condivisione (share/copia/WhatsApp in vari moduli).
- **Motore unico** [CONFERMATO]:
  - `pdfEngine` deve restare la base comune; evitare motori paralleli.

## 10. IA
- **Dove vive** [CONFERMATO]:
  - IA documentale e libretti in area IA; supporto da Functions (`aiCore`, `estrazioneDocumenti`, pipeline cisterna).
- **Come si integra** [CONFERMATO+RACCOMANDAZIONE]:
  - Intake documenti globale, consumo dati in dossier/analisi/operativita.
- **IA documentale** [CONFERMATO]:
  - Salvataggio su `@documenti_mezzi/@documenti_magazzino/@documenti_generici`.
- **IA dossier** [RACCOMANDAZIONE]:
  - Sintesi e assistenza contestuale per targa dentro Dossier Mezzo.
- **IA analisi** [CONFERMATO]:
  - Analisi economica per mezzo gia presente, da consolidare nella UX target.
- **Chat IA interna** [NON DIMOSTRATO]:
  - Nel repository non c'e una chat IA interna general-purpose gia operativa.
  - **[RACCOMANDAZIONE]** introdurla in fase successiva con scope e permessi chiari.

## 11. Scadenze / promemoria / memoria esterna
- **Stato attuale** [CONFERMATO]:
  - Esiste gestione stato alert (`@alerts_state`) e priorita in Home/Centro Controllo.
- **Cosa deve ricordare il sistema** [RACCOMANDAZIONE]:
  - Scadenze revisioni/bollo/assicurazioni/libretti.
  - Task operativi non chiusi.
  - Incongruenze dati da verificare.
  - Eventi autisti critici non presi in carico.
- **Come compare in UI** [RACCOMANDAZIONE]:
  - Widget priorita giornaliere + badge stato + reminder timeline per mezzo.
- **Memoria esterna strutturata** [RACCOMANDAZIONE]:
  - Registro decisioni (`PROJECT_DECISIONS_LOG`) e audit eventi.

## 12. Sicurezza / ruoli / permessi
- **Fonte completa**: `docs/security/SECURITY_AND_PERMISSIONS_BLUEPRINT.md` [CONFERMATO].
- **Punto attuale** [CONFERMATO]:
  - Routing app non dimostra guard ruoli admin/capo.
  - Storage rules correnti bloccano tutto (`allow read, write: if false`).
- **Direzione target** [RACCOMANDAZIONE]:
  - Account e permessi espliciti, audit log, segregazione area autisti.

## 13. Regole UI globali
- **Regole base** [RACCOMANDAZIONE]:
  - Coerenza naming e route.
  - Stati UI standard (loading/error/empty/success).
  - CTA primarie visibili, secondarie in pannelli/azioni avanzate.
  - Ogni vista mezzo-centrica deve avere ponte al Dossier.
- **Regole anti-frammentazione** [RACCOMANDAZIONE]:
  - Una route canonica per ogni dettaglio.
  - Evitare duplicazioni tab su pagine diverse con stesso scopo.

## 14. Cose da non dimenticare
- **Vincoli trasversali** [CONFERMATO]:
  - Conservare compatibilita con base dati legacy.
  - Non introdurre cambi distruttivi senza migrazione.
- **Collegamenti obbligatori al mezzo** [RACCOMANDAZIONE]:
  - Tutte le entita con targa devono avere percorso rapido al Dossier.
- **Punti critici** [CONFERMATO]:
  - Eventi autisti canonicali.
  - Allegati preventivi.
  - Permessi/ruoli.
  - Route legacy e bookmark.

## 15. Stato progetto e prossimi step
- **Stato attuale** [CONFERMATO]:
  - Mappatura architettura e dati completata in `docs/`.
  - Incoerenze principali identificate e tracciate.
- **Prossimi step obbligatori** [RACCOMANDAZIONE]:
  1. Congelare questo blueprint come riferimento per ogni patch futura.
  2. Consolidare route canoniche (mantenendo alias controllati).
  3. Definire matrice permessi e audit prima dei refactor funzionali.
  4. Avviare nuova app in parallelo in modalita read-only.
  5. Attivare fasi progressive di convergenza writer per area.

---

## Fonte di verita (ordine)
1. `docs/PROJECT_MASTER_BLUEPRINT.md` (questo file)
2. `docs/architecture/NEXT_APP_ARCHITECTURE.md`
3. `docs/data/DATA_MASTER_MAP.md`
4. `docs/data/DATA_CONTRACT_MASTER.md`
5. `docs/security/SECURITY_AND_PERMISSIONS_BLUEPRINT.md`
6. `docs/product/PROJECT_DECISIONS_LOG.md`
