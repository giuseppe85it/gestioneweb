# CHANGE REPORT - Ridisegno UI sottosistema IA interna

## Data
- 2026-03-13 20:34

## Tipo task
- ui

## Obiettivo
- Rendere `/next/ia/interna*` piu semplice, professionale e chiaro, con chat centrale in home e preview report mezzo piu ordinata, senza toccare logica dati o backend.

## File modificati
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/internal-ai.css`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/change-reports/2026-03-13_2034_ui_ridisegno-ui-sottosistema-ia-interna.md`
- `docs/continuity-reports/2026-03-13_2034_continuity_ui-sottosistema-ia-interna.md`

## Riassunto modifiche
- Ridisegnata la home IA con chat protagonista, input ampio, suggerimenti iniziali ridotti e area secondaria meno invasiva per archivio, recenti e stati.
- Riorganizzata la preview report mezzo con struttura piu vicina al dossier: hero iniziale, card riepilogative, sezioni principali nel corpo, fonti/copertura e azioni in colonna laterale.
- Spostati guard rail, memoria modulo e contratti in area avanzata comprimibile per ridurre il rumore tecnico in primo piano.
- Riallineati in italiano i testi visibili toccati dal redesign.
- Aggiornati checklist, stato avanzamento IA, stato migrazione NEXT e registro clone.

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- UI del sottosistema IA piu leggibile e adatta a diventare ingresso principale del modulo.
- Nessun impatto su facade, domain, backend, dataset business o flussi correnti.

## Rischio modifica
- NORMALE

## Moduli impattati
- sottosistema IA interna NEXT
- documentazione operativa clone/IA

## Contratti dati toccati?
- NO

## Punto aperto collegato?
- NO

## Legacy o Next?
- NEXT

## Modulo/area NEXT coinvolta
- analisi

## Stato migrazione prima
- IMPORTATO READ-ONLY

## Stato migrazione dopo
- IMPORTATO READ-ONLY

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- SI

## Necessita aggiornamento stato progetto?
- NO

## Rischi / attenzione
- Il redesign non attiva report autista o report combinato: restano esplicitamente non disponibili.
- Il modulo resta dipendente dalla logica dati gia esistente; questo task non corregge eventuali limiti strutturali dei report.

## Build/Test eseguiti
- `npx eslint src/next/NextInternalAiPage.tsx` -> OK
- `npm run build` -> OK
- Note residue: warning esterno su `baseline-browser-mapping` non aggiornato e warning Vite sui chunk grandi.

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO

---

Regole template:
- niente codice
- niente diff
- linguaggio semplice e sintetico
