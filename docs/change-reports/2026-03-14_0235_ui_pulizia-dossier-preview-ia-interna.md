# CHANGE REPORT - Pulizia dossier-like preview IA interna

## Data
- 2026-03-14 02:35

## Tipo task
- ui

## Obiettivo
- Ripulire in modo deciso la UI del sottosistema IA interna, soprattutto il report/preview, riducendo rumore tecnico, note visibili subito e look da dashboard/debug.

## File modificati
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/internal-ai.css`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/change-reports/2026-03-14_0235_ui_pulizia-dossier-preview-ia-interna.md`
- `docs/continuity-reports/2026-03-14_0235_continuity_pulizia-dossier-preview-ia-interna.md`

## Riassunto modifiche
- Home alleggerita ulteriormente: chat e richiesta restano primarie, archivio/recenti e dettagli tecnici sono piu secondari.
- Preview report trasformata in vista piu dossier-like:
  - hero pulito;
  - poche card chiave subito visibili;
  - sezioni principali in chiaro;
  - dettagli tecnici, fonti, limiti e azioni locali dietro espansioni.
- Preview analisi economica riallineata alla stessa logica di sintesi e approfondimento secondario.
- Rafforzato il contrasto visivo e la gerarchia tra area primaria, badge e pannelli secondari.

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- Esperienza piu professionale e meno rumorosa nella lettura del risultato.
- Home meno affollata e piu focalizzata sulla richiesta.
- Nessun impatto su logica dati, facade, domain, backend o flussi correnti.

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
- La classificazione visiva delle sezioni del report usa solo il contenuto gia presente nella preview; non cambia il dominio dati sottostante.
- I dettagli tecnici sono nascosti meglio, ma restano disponibili tramite espansione per non perdere trasparenza operativa.

## Build/Test eseguiti
- `npx eslint src/next/NextInternalAiPage.tsx` -> OK
- `npm run build` -> OK
- Note residue: warning esterno su `baseline-browser-mapping` non aggiornato e warning Vite sui chunk grandi.

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO
