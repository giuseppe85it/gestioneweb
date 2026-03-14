# CHANGE REPORT - Governo operativo Codex con `AGENTS.md` fonte primaria

## Data
- 2026-03-13 19:09

## Tipo task
- docs

## Obiettivo
- Rendere `AGENTS.md` la fonte primaria delle regole operative Codex sul repo, ridurre la dipendenza da prompt lunghi ripetuti e chiarire il workflow minimo dei task futuri senza toccare runtime o logica business.

## File modificati
- AGENTS.md
- docs/LEGGI_PRIMA.md
- docs/INDICE_DOCUMENTAZIONE_PROGETTO.md
- docs/STATO_ATTUALE_PROGETTO.md
- docs/product/REGOLE_LAVORO_CODEX.md
- docs/product/STORICO_DECISIONI_PROGETTO.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md
- docs/change-reports/2026-03-13_1909_docs_governo-operativo-agents-codex.md
- docs/continuity-reports/2026-03-13_1909_continuity_governo-operativo-codex.md

## Riassunto modifiche
- Rafforzato `AGENTS.md` con sezioni iniziali piu operative: fonte primaria, workflow rapido, regole progetto, task IA interna e formato corto dei task.
- Allineato `docs/product/REGOLE_LAVORO_CODEX.md` per chiarire che resta un supporto secondario e non la fonte primaria operativa.
- Riallineati `docs/LEGGI_PRIMA.md` e `docs/INDICE_DOCUMENTAZIONE_PROGETTO.md` per instradare i task operativi verso `AGENTS.md`.
- Aggiornati `docs/STATO_ATTUALE_PROGETTO.md` e `docs/product/STORICO_DECISIONI_PROGETTO.md` per dichiarare la nuova regola di governo e l'effetto sui prompt futuri.
- Registrata la modifica nel registro clone e creati i report obbligatori di task.

## File extra richiesti (se presenti)
- NESSUNO

## Impatti attesi
- Riduzione dei prompt ripetitivi: i task futuri possono esplicitare solo obiettivo, perimetro e output richiesto salvo vincoli speciali.
- Maggiore costanza del metodo Codex sul repo senza cambiare codice applicativo, dataset o flussi runtime.

## Rischio modifica
- NORMALE

## Moduli impattati
- Governo operativo Codex
- Documentazione progetto

## Contratti dati toccati?
- NO

## Punto aperto collegato?
- NO

## Legacy o Next?
- ENTRAMBI

## Modulo/area NEXT coinvolta
- nessuna

## Stato migrazione prima
- N/A

## Stato migrazione dopo
- N/A

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- NO

## Necessita aggiornamento stato progetto?
- SI

## Rischi / attenzione
- Evitare che `AGENTS.md` diventi una copia lunga dei documenti di progetto invece di una guida operativa sintetica.
- Mantenere allineato `docs/product/REGOLE_LAVORO_CODEX.md` come supporto secondario, senza ricreare doppia verita.

## Build/Test eseguiti
- NON ESEGUITO: task solo documentale

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO

---

Regole template:
- niente codice
- niente diff
- linguaggio semplice e sintetico
