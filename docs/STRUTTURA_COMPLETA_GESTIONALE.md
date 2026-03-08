# STRUTTURA COMPLETA GESTIONALE

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
  - Rendere `IA Gestionale / Assistente Gestionale` una macro-area visibile della NEXT, non un modulo marginale.
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
- **Macro-aree shell NEXT** [RACCOMANDAZIONE]:
  - `Centro di Controllo`
  - `Mezzi / Dossier`
  - `Operativita Globale`
  - `IA Gestionale`
  - `Strumenti Trasversali`
- **Nota di lettura** [RACCOMANDAZIONE]:
  - Queste 5 macro-aree sono la lettura top-level della shell NEXT.
  - I moduli interni restano piu granulari e continuano a esistere come viste o sottosezioni.
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
- **IA Gestionale / Assistente Gestionale** [RACCOMANDAZIONE]:
  - Macro-area visibile della shell NEXT dedicata a supporto intelligente, lettura contestuale dei moduli e report assistiti.
- **Autisti** [RACCOMANDAZIONE]:
  - Area separata (app campo + inbox/rettifica admin).
- **Strumenti Trasversali / Supporto** [RACCOMANDAZIONE]:
  - Config, permessi, audit, PDF standard, ricerca, notifiche, strumenti tecnici.

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
  - Dominio cisterna specialistico.
  - Sistema, sicurezza, configurazioni, supporto tecnico.
- **Nota IA** [RACCOMANDAZIONE]:
  - L'intake IA non scompare, ma nella NEXT viene letto dentro la macro-area `IA Gestionale` con agganci trasversali ai moduli.
- **Motivazione** [CONFERMATO]:
  - Questi moduli non sono confinati a una singola targa.

## 8. Dati / storage / chiavi / collezioni
- **Fonte completa**: `docs/data/MAPPA_COMPLETA_DATI.md` [CONFERMATO].
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
- **Distinzione target** [RACCOMANDAZIONE]:
  - `PDF standard` = strumento trasversale tecnico.
  - `PDF intelligenti / report assistiti` = funzioni guidate dall'area `IA Gestionale`.

## 10. IA
- **Dove vive oggi** [CONFERMATO]:
  - IA documentale e libretti in area IA; supporto da Functions (`aiCore`, `estrazioneDocumenti`, pipeline cisterna).
- **Decisione target** [RACCOMANDAZIONE]:
  - Nella NEXT la IA diventa `IA Gestionale / Assistente Gestionale`, cioe sia macro-area visibile sia motore trasversale.
- **Perimetro reale V1** [RACCOMANDAZIONE]:
  - La prima versione sensata della `IA Business` nella NEXT deve restare `read-only`.
  - Le prime superfici da presidiare sono `Dossier Mezzo` e `Centro di Controllo`.
  - L'obiettivo iniziale e aiutare a leggere meglio il sistema, non introdurre nuove scritture.
- **Come si integra** [CONFERMATO+RACCOMANDAZIONE]:
  - Intake documenti globale, consumo dati in dossier/analisi/operativita.
  - Supporto a scadenze, anomalie, suggerimenti operativi, dossier, ordini, inventario, rifornimenti, segnalazioni, lavori, collaudi, documenti e report intelligenti.
- **Output minimo richiesto alla IA Business v1** [RACCOMANDAZIONE]:
  - Riassunto stato mezzo o stato sistema.
  - Evidenza di scadenze, anomalie, priorita e suggerimenti motivati.
  - Spiegabilita obbligatoria: `fonte dati`, `modulo sorgente`, `periodo`.
  - Marcatura `DA VERIFICARE` quando l'affidabilita del dato o del collegamento non e piena.
- **Punto di arrivo** [RACCOMANDAZIONE]:
  - L'area `IA Gestionale` resta piu ampia della V1.
  - In prospettiva puo estendersi a documenti, PDF intelligenti, report assistiti, acquisti, inventario e supporto trasversale ai moduli.
  - Il rollout deve restare progressivo e controllato.
- **IA documentale** [CONFERMATO]:
  - Salvataggio su `@documenti_mezzi/@documenti_magazzino/@documenti_generici`.
- **IA dossier** [RACCOMANDAZIONE]:
  - Sintesi e assistenza contestuale per targa dentro Dossier Mezzo.
- **IA analisi** [CONFERMATO]:
  - Analisi economica per mezzo gia presente, da consolidare nella UX target.
- **Separazione capability** [RACCOMANDAZIONE]:
  - `IA Business NEXT`: assistenza runtime dentro la nuova app, orientata ai dati operativi e alle decisioni utente.
  - `IA Audit Tecnico`: capability distinta, piu vicina ad audit di repository, documentazione e contratti dati.
  - Le due capability possono convergere in futuro sul piano strategico, ma non vanno confuse nella V1.
- **IA di controllo architetturale / dati** [RACCOMANDAZIONE]:
  - In prospettiva potra leggere repository, confrontare moduli/docs/contratti dati, segnalare incoerenze e aiutare a localizzare il problema.
  - Questa capacita appartiene al perimetro `IA Audit Tecnico`, non alla V1 runtime della `IA Business`.
- **Chat IA interna** [NON DIMOSTRATO]:
  - Nel repository non c'e una chat IA interna general-purpose gia operativa.
  - **[RACCOMANDAZIONE]** introdurla solo in fase successiva, con scope e permessi chiari, evitando di partire da una chat "onnisciente" su tutti i moduli.
- **Governance** [RACCOMANDAZIONE]:
  - La IA segnala, motiva e propone.
  - L'utente decide.
  - ChatGPT analizza e struttura.
  - Codex applica le patch.
  - La IA non deve patchare liberamente da sola e non autorizza nuove scritture o refactor rischiosi in questa fase.
- **Cose da non fare subito** [RACCOMANDAZIONE]:
  - Nessuna scrittura automatica.
  - Nessuna correzione dati autonoma.
  - Nessun audit repo/docs/dati dentro la stessa runtime UI della NEXT.
  - Nessun supporto dichiarato come completo su flussi non ancora canonici.

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
  - Registro decisioni (`STORICO_DECISIONI_PROGETTO`) e audit eventi.

## 12. Sicurezza / ruoli / permessi
- **Fonte completa**: `docs/security/SICUREZZA_E_PERMESSI.md` [CONFERMATO].
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
  - Governance reale della IA rispetto a backend, PDF intelligenti e automazioni future.

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
1. `docs/STRUTTURA_COMPLETA_GESTIONALE.md` (questo file)
2. `docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md`
3. `docs/data/MAPPA_COMPLETA_DATI.md`
4. `docs/data/REGOLE_STRUTTURA_DATI.md`
5. `docs/security/SICUREZZA_E_PERMESSI.md`
6. `docs/product/STORICO_DECISIONI_PROGETTO.md`

