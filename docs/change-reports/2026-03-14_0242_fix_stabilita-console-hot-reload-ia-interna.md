# CHANGE REPORT - Stabilita console e hot reload IA interna

## Data
- 2026-03-14 02:42

## Tipo task
- fix

## Obiettivo
- Eliminare gli errori attuali di console e hot reload collegati alla UI IA interna, senza toccare la logica dati del sottosistema.

## File modificati
- `src/pages/Home.tsx`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/change-reports/2026-03-14_0242_fix_stabilita-console-hot-reload-ia-interna.md`
- `docs/continuity-reports/2026-03-14_0242_continuity_stabilita-console-hot-reload-ia-interna.md`

## Riassunto modifiche
- Verificato che `src/next/NextInternalAiPage.tsx` non mostra oggi un errore persistente di sintassi o import/export: il `500 / failed to reload` Vite non e riproducibile nello stato corrente del repo.
- Individuata la root cause concreta del warning React sulle `key`: proveniva dalla `Home` madre, non dal subtree IA, per via di chiavi basate solo su `targa` in liste che possono contenere duplicati.
- Applicato un fix minimo in `src/pages/Home.tsx`, rendendo sempre stabili le `key` tramite suffisso con indice locale.
- Aggiornata la documentazione operativa IA/NEXT per tracciare il confine reale del problema e il fix applicato.

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- Riduzione del warning React `Each child in a list should have a unique "key" prop` nel rendering di `Home`.
- Nessun cambiamento alla logica dati, ai flussi business o al runtime del sottosistema IA.
- Chiarezza documentale sul fatto che `NextInternalAiPage.tsx` oggi non presenta un errore Vite persistente.

## Rischio modifica
- BASSO

## Moduli impattati
- Home legacy/madre
- documentazione operativa IA/NEXT

## Contratti dati toccati?
- NO

## Punto aperto collegato?
- NO

## Legacy o Next?
- NEXT + MADRE MINIMALE

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
- Il warning `key` e stato corretto nel punto minimo individuato; eventuali warning futuri diversi vanno verificati separatamente e non dedotti da questo task.
- `eslint` sulla `Home` madre contiene errori legacy preesistenti non collegati a questa correzione minima; non sono stati toccati in questo task.

## Build/Test eseguiti
- `npx eslint src/next/NextInternalAiPage.tsx` -> OK
- `npm run build` -> OK
- Note residue: warning esterno su `baseline-browser-mapping` non aggiornato e warning Vite sui chunk grandi.

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO
