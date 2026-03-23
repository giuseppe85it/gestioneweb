# CHANGE REPORT - Chat conversazionale controllata e report come artifact documento

## Data
- 2026-03-22 18:34

## Tipo task
- patch
- ux

## Obiettivo
- trasformare `/next/ia/interna` da pannello tecnico a esperienza conversazionale piu chiara e usabile, mantenendo i guard rail esistenti e spostando i report strutturati su artifact/modale documento dedicata.

## File modificati
- src/next/NextInternalAiPage.tsx
- src/next/internal-ai/internal-ai.css
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/STATO_AVANZAMENTO_IA_INTERNA.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md
- docs/STATO_ATTUALE_PROGETTO.md

## Riassunto modifiche
- Aggiornata la pagina IA con input chat multilinea, thread piu leggibile e card leggere di stato backend/fallback.
- Le richieste report pronte vengono ora salvate subito come artifact IA e aperte in una modale di anteprima documento.
- Nel thread resta solo un messaggio breve con richiamo riapribile all'artifact/anteprima.
- Ridotti i muri di testo inline del report nella overview e nell'archivio artifact.

## File extra richiesti (se presenti)
- NESSUNO

## Impatti attesi
- La pagina IA e piu comprensibile per utenti non tecnici.
- I report non interrompono piu il thread con testo lungo.
- Restano invariati perimetro controllato, fallback esplicito, traceability e nessuna scrittura business.

## Rischio modifica
- NORMALE

## Moduli impattati
- IA interna NEXT
- overview `/next/ia/interna`
- archivio artifact IA

## Contratti dati toccati?
- NO

## Punto aperto collegato?
- SI: evoluzione futura da preview documento testuale a export/PDF dedicato nel solo perimetro IA

## Legacy o Next?
- NEXT

## Modulo/area NEXT coinvolta
- IA interna

## Stato migrazione prima
- IMPORTATO READ-ONLY

## Stato migrazione dopo
- IMPORTATO READ-ONLY

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- SI

## Necessita aggiornamento stato progetto?
- SI

## Rischi / attenzione
- La modale usa ancora una preview documento con export testo, non un PDF server-side dedicato.
- Il salvataggio artifact automatico avviene solo sui report pronti e riusa il repository IA gia esistente.

## Build/Test eseguiti
- npx eslint src/next/NextInternalAiPage.tsx -> OK
- npm run build -> OK

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO
