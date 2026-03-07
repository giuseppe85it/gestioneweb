# STATO MIGRAZIONE NEXT

## 1. Scopo del documento
Questo documento e il registro ufficiale e permanente dello stato di migrazione della nuova app NEXT.

Serve a:
- capire in pochi minuti cosa esiste davvero nella NEXT e cosa no;
- evitare lavoro duplicato, importazioni parziali dimenticate e perdita di contesto tra chat/sessioni;
- distinguere chiaramente shell, UI importata, read-only, scrittura attiva e parti che restano legacy;
- lasciare una traccia stabile per ogni avanzamento reale su shell, pagine, moduli o integrazioni.

Va aggiornato ogni volta che un task tocca la NEXT e modifica anche solo uno di questi aspetti:
- stato di migrazione;
- livello di lettura/scrittura dati;
- decisione di mantenere una parte in legacy;
- rischi o blocchi emersi durante la migrazione.

## 2. Regole di lettura
Questo documento serve a capire, per ogni area/modulo della NEXT:
- se esiste gia qualcosa nel repo oppure no;
- se e presente solo una shell;
- se e stata importata solo la UI;
- se legge dati reali;
- se scrive dati reali;
- se resta in legacy;
- se una parte e ancora `DA VERIFICARE`.

Importante:
- questo documento non sostituisce `docs/STATO_ATTUALE_PROGETTO.md`;
- questo documento non sostituisce i change report del singolo task;
- questo documento non sostituisce i continuity report tra sessioni;
- questo documento traccia solo lo stato di avanzamento della NEXT e il suo rapporto con la legacy.

## 3. Stati standard di migrazione

### `NON INIZIATO`
Significa che nel repo non e dimostrata alcuna implementazione reale della parte NEXT.

Usarlo quando:
- esiste solo documentazione o blueprint;
- non esiste ancora shell, route o modulo NEXT verificabile.

### `SHELL CREATA`
Significa che esiste il contenitore/base della schermata o area NEXT, ma senza una migrazione funzionale reale.

Usarlo quando:
- la shell e presente;
- la pagina puo anche essere navigabile;
- i contenuti sono placeholder, incompleti o non ancora importati.

### `IMPORTATO SOLO UI`
Significa che la struttura visiva e stata portata nella NEXT, ma senza lettura reale dei dati o con dati finti/mock/statici.

Usarlo quando:
- la UI e stata importata o ricostruita;
- non c'e ancora integrazione affidabile con dati reali.

### `IMPORTATO READ-ONLY`
Significa che il modulo NEXT legge dati reali ma non scrive.

Usarlo quando:
- il modulo e operativo in consultazione;
- eventuali azioni di modifica sono assenti o volutamente disattivate.

### `IMPORTATO CON SCRITTURA`
Significa che il modulo NEXT legge dati reali e abilita anche scrittura reale.

Usarlo quando:
- la scrittura e attiva almeno per una parte del flusso;
- la responsabilita sul dato non e piu solo legacy.

### `DA VERIFICARE`
Significa che non ci sono prove sufficienti per classificare con certezza lo stato reale.

Usarlo quando:
- il repo o i documenti non permettono di dimostrare il livello reale di migrazione;
- esistono segnali contraddittori o incompleti.

### `COMPLETATO`
Significa che, per il perimetro deciso, il modulo e considerato migrato nella NEXT.

Usarlo quando:
- shell, UI, dati e comportamento previsti risultano presenti nel perimetro concordato;
- eventuali dipendenze residue dalla legacy sono note e dichiarate.

### `RIMANE LEGACY`
Significa che la parte non viene migrata nella NEXT in questa fase e resta intenzionalmente sulla legacy.

Usarlo quando:
- la scelta e esplicita;
- la NEXT si limita eventualmente a un collegamento, una vista sintetica o un'integrazione.

## 4. Tipi standard di migrazione

### `RIUSO QUASI DIRETTO`
Usarlo quando la parte attuale e gia abbastanza solida da essere riportata quasi integralmente nella NEXT con adattamenti minimi.

### `RIUSO LOGICA + UI NUOVA`
Usarlo quando si intende conservare logica/contratti/struttura funzionale ma ricostruire la UI in modo coerente con la shell NEXT.

### `RISCRITTURA PULITA`
Usarlo quando conviene ricostruire il modulo in modo pulito invece di importarlo dal legacy.

### `LEGACY TEMPORANEO`
Usarlo quando la parte resta attiva nella legacy e la NEXT, per ora, non la sostituisce.

### `DA DECIDERE`
Usarlo quando il tipo di migrazione non e ancora dimostrabile o non e ancora stato deciso.

## 5. Tabella principale di avanzamento

Nota iniziale:
- questa prima versione del registro e compilata in base allo stato reale del repo al `2026-03-07`;
- nel repository e presente documentazione NEXT ampia, ma non e dimostrata una shell NEXT implementata come app/moduli runtime separati;
- per questo la tabella iniziale usa in modo prudente `NON INIZIATO` dove non esistono prove di migrazione reale.

| Area / Modulo | Stato migrazione | Tipo migrazione | Dati reali letti? | Scrittura attiva? | Legacy o Next? | File/moduli di riferimento attuali | Note / rischi | Ultimo aggiornamento | Commit hash |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Shell globale NEXT | NON INIZIATO | RISCRITTURA PULITA | no | no | NEXT | `docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md`; `docs/ui-blueprint/BLUEPRINT_GRAFICO_NEXT.md`; `docs/ui-blueprint/DESIGN_SYSTEM_NEXT.md` | Blueprint e design system presenti; shell UI reale NEXT non dimostrata nel repo runtime. | 2026-03-07 | N/A - inizializzazione registro |
| Home / Centro di Controllo | NON INIZIATO | RIUSO LOGICA + UI NUOVA | no | no | NEXT | `src/pages/Home.tsx`; `src/pages/CentroControllo.tsx`; `docs/ui-blueprint/WIREFRAME_LOGICI_NEXT.md` | Base legacy forte per modello NEXT, ma nessun modulo NEXT attivo dimostrato. | 2026-03-07 | N/A - inizializzazione registro |
| Flotta | NON INIZIATO | RIUSO LOGICA + UI NUOVA | no | no | NEXT | `src/pages/Mezzi.tsx`; `src/pages/CapoMezzi.tsx`; `src/pages/CapoCostiMezzo.tsx` | Rischio di importazione incoerente se si mescolano pattern vecchi e nuovi senza standard shell unico. | 2026-03-07 | N/A - inizializzazione registro |
| Dossier Mezzo | NON INIZIATO | RIUSO LOGICA + UI NUOVA | no | no | NEXT | `src/pages/DossierMezzo.tsx`; `src/pages/AnalisiEconomica.tsx`; `docs/ui-blueprint/MAPPA_PATTERN_DA_RIUSARE.md` | Modulo legacy considerato base forte per la NEXT, ma dossier NEXT reale non ancora presente. | 2026-03-07 | N/A - inizializzazione registro |
| Operativita | NON INIZIATO | RIUSO LOGICA + UI NUOVA | no | no | NEXT | `src/pages/GestioneOperativa.tsx`; `src/pages/LavoriInAttesa.tsx`; `src/pages/LavoriDaEseguire.tsx`; `src/pages/LavoriEseguiti.tsx` | Da migrare separando bene flussi globali e flussi mezzo-centrici. | 2026-03-07 | N/A - inizializzazione registro |
| Magazzino | NON INIZIATO | RIUSO LOGICA + UI NUOVA | no | no | NEXT | `src/pages/Acquisti.tsx`; `src/pages/Inventario.tsx`; `src/pages/MaterialiDaOrdinare.tsx`; `src/pages/MaterialiConsegnati.tsx` | `MaterialiDaOrdinare` trattato come funzione valida ma da collocare nella shell nuova, non come shell autonoma da trascinare. | 2026-03-07 | N/A - inizializzazione registro |
| Analisi | NON INIZIATO | RIUSO LOGICA + UI NUOVA | no | no | NEXT | `src/pages/AnalisiEconomica.tsx`; `src/pages/CapoCostiMezzo.tsx` | Buona base analitica legacy, ma nessuna area analisi NEXT attiva e dimostrata. | 2026-03-07 | N/A - inizializzazione registro |
| Sistema / Utenti e permessi | NON INIZIATO | DA DECIDERE | no | no | NEXT | `docs/security/SICUREZZA_E_PERMESSI.md`; `src/autistiInbox/AutistiAdmin.tsx`; `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md` | Matrice ruoli/permessi finale ancora da consolidare; rischio alto se la NEXT scrive prima di chiarire i permessi. | 2026-03-07 | N/A - inizializzazione registro |
| Area Autisti (integrazione/collegamento) | RIMANE LEGACY | LEGACY TEMPORANEO | no | no | LEGACY | `src/autisti/HomeAutista.tsx`; `src/autistiInbox/AutistiInboxHome.tsx`; `src/autistiInbox/AutistiAdmin.tsx` | Area attiva lato legacy; eventuale collegamento dalla NEXT da definire senza assumere una riscrittura completa. | 2026-03-07 | N/A - inizializzazione registro |

## 6. Regole di aggiornamento
Regola operativa:
- ogni task futuro che tocca la NEXT deve aggiornare questo documento;
- ogni importazione o migrazione di modulo deve lasciare una traccia qui;
- se una parte passa da read-only a scrittura, l'aggiornamento va fatto subito;
- se una parte resta legacy, va segnato chiaramente;
- se emerge un blocco tecnico, architetturale o documentale, va scritto nelle note/rischi.

Aggiornamento minimo richiesto per ogni task NEXT:
1. individuare la riga o le righe coinvolte;
2. aggiornare almeno stato, note/rischi, data e hash commit quando il task cambia davvero lo stato della migrazione;
3. se il task non cambia lo stato ma chiarisce qualcosa di rilevante, aggiornare almeno le note;
4. se eccezionalmente il file non viene aggiornato, Codex deve spiegarlo esplicitamente in chat e nel change report.

## 7. Distinzione tra Legacy e Next
- La legacy resta il sistema attivo, stabile e operativo corrente.
- La NEXT cresce in parallelo, senza cancellare o riscrivere alla cieca la legacy.
- Questo documento traccia solo la nuova costruzione NEXT e il suo rapporto con i moduli legacy di origine.
- Il fatto che un modulo legacy sia una buona base non significa che sia gia migrato.

## 8. Stato documento
- **STATO: CURRENT**
