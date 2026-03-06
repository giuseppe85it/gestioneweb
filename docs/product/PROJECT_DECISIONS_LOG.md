# PROJECT DECISIONS LOG

Registro decisionale architetturale del progetto GestioneManutenzione.  
Fonte di verita: usare questo file insieme a `docs/PROJECT_MASTER_BLUEPRINT.md`.

## Legenda stato
- `confermato`: decisione supportata da documentazione/repository e adottata nel blueprint.
- `da verificare`: decisione tracciata ma richiede conferma tecnica/organizzativa ulteriore.

## Decisioni (cronologico sintetico)

| Data | Decisione | Motivo | Impatto | Stato |
|---|---|---|---|---|
| 2026-03-06 | Nuova app costruita in parallelo alla legacy | Evitare rischio big-bang e regressioni operative | Permette rollout graduale e confronto diretto legacy/target | confermato |
| 2026-03-06 | Stessa base dati iniziale (nessuna duplicazione DB in partenza) | Mantenere continuita operativa e allineamento dati reale | Richiede forte disciplina su contratti dati e migrazioni | confermato |
| 2026-03-06 | Fase 1 della nuova app in read-only | Validare IA e convergenza senza introdurre scritture rischiose | Riduce impatto su produzione, accelera validazione UX | confermato |
| 2026-03-06 | Home diventa Centro di Controllo | Ridurre frammentazione ingressi e priorita disperse | Dashboard unica priorita/code/azioni rapide | confermato |
| 2026-03-06 | Dossier Mezzo diventa cuore del sistema | Dominio mezzo/targa e il principale asse operativo | Convergenza moduli targa-centrici in una vista unificata | confermato |
| 2026-03-06 | IA integrata, non modulo isolato | IA gia alimenta documenti, libretti, analisi e flussi operativi | IA come capability trasversale con ingressi dedicati | confermato |
| 2026-03-06 | PDF trattato come funzione trasversale | Export e preview sono diffusi su piu moduli | Centralita `pdfEngine`, UX PDF coerente cross-modulo | confermato |
| 2026-03-06 | Area Autisti separata da area Admin | Flussi e vincoli operativi diversi (campo vs ufficio) | Shell e permessi distinti, integrazione via dati/eventi | confermato |
| 2026-03-06 | Canonicalizzazione route necessaria (alias legacy da ridurre) | Esistono percorsi duplicati per stesse entita | Migliora navigazione, bookmark e manutenzione | confermato |
| 2026-03-06 | Stream eventi autisti da unificare su sorgente canonica | Incoerenza rilevata `autisti_eventi` vs `@storico_eventi_operativi` | Riduce mismatch reader/writer e errori di reporting | da verificare |
| 2026-03-06 | Pattern allegati preventivi da unificare | Coesistono path `preventivi/ia/*` e `preventivi/{id}.pdf` | Evita frammentazione gestione allegati e cleanup | da verificare |
| 2026-03-06 | Modello account target a 3 livelli (Super Admin, Gestionale, Autista) | Necessita segregazione responsabilita e rischio | Base per permission matrix configurabile da pannello | da verificare |
| 2026-03-06 | Permessi configurabili per modulo/azione | Ruoli statici non bastano in contesti operativi variabili | Abilitazioni granulari (R/C/U/D, PDF, IA, sensibili) | da verificare |
| 2026-03-06 | Audit log applicativo trasversale obbligatorio | Serve tracciabilita su rettifiche/import/cancellazioni | Supporta sicurezza, compliance e debug operativo | da verificare |
| 2026-03-06 | Nuova architettura guidata da blueprint prima delle patch | Ridurre incoerenze da patch locali non coordinate | Ogni richiesta Codex deve allinearsi al blueprint | confermato |

## Decisioni derivate da stato attuale repository
- Autenticazione anonima all'avvio app [CONFERMATO da codice].
- Assenza di guard ruolo esplicita lato route admin/capo [CONFERMATO da codice].
- `storage.rules` attuali bloccanti su ogni read/write [CONFERMATO da codice].
- Assenza file `firestore.rules` nel repository corrente [CONFERMATO].

## Regola operativa
Qualsiasi nuova decisione architetturale deve essere aggiunta qui con:
1. data,
2. motivo concreto,
3. impatto su moduli/dati/sicurezza,
4. stato `confermato` o `da verificare`.
