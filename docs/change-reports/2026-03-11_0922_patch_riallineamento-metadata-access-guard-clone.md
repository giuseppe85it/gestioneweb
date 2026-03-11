# CHANGE REPORT - Riallineamento metadata access e guard del clone

## Data
- 2026-03-11 09:22

## Tipo task
- patch

## Obiettivo
- Riallineare la mappa interna del clone read-only alle route gia attive, aggiornando metadata centrali, access map e guard minima senza aprire nuovi moduli business.

## File modificati
- src/App.tsx
- src/next/nextData.ts
- src/next/nextAccess.ts
- src/next/NextRoleGuard.tsx
- docs/product/REGISTRO_MODIFICHE_CLONE.md
- docs/product/STATO_MIGRAZIONE_NEXT.md

## Riassunto modifiche
- Aggiornato `nextData.ts` con nuove aree attive del clone (`Area Capo`, `Colleghi`, `Fornitori`, `Libretti Export`) e con metadata non piu fermi alla vecchia fase shell.
- Aggiunta una mappa centrale delle route clone attive, distinguendo moduli reali, placeholder autista separato e redirect tecnico `/next/ia-gestionale`.
- Aggiornato `nextAccess.ts` con permission key e access config coerenti con le route clone gia vive.
- Resa `NextRoleGuard.tsx` coerente con la registry accessi, ma lasciata volutamente permissiva per non introdurre blocchi runtime nuovi.
- Sistemati in `App.tsx` gli `areaId` usati dalle route gia aperte (`capo`, `libretti-export`, `autista-separato`).

## File extra richiesti (se presenti)
- NESSUNO

## Impatti attesi
- Nessun nuovo modulo viene aperto o chiuso.
- La shell clone continua a funzionare, ma la sua mappa interna non resta piu in contraddizione con il runtime reale.

## Rischio modifica
- NORMALE

## Moduli impattati
- NEXT / metadata centrali
- NEXT / access map
- NEXT / route guard minima

## Contratti dati toccati?
- NO

## Punto aperto collegato?
- SI: Matrice ruoli/permessi definitiva

## Legacy o Next?
- NEXT

## Modulo/area NEXT coinvolta
- altro

## Stato migrazione prima
- IMPORTATO READ-ONLY

## Stato migrazione dopo
- IMPORTATO READ-ONLY

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- SI

## Necessita aggiornamento stato progetto?
- NO

## Rischi / attenzione
- La guardia resta intenzionalmente permissiva: il task riallinea la registry e non introduce auth reale.
- La topbar clone non viene riallineata in questo task: il catalogo centrale e piu completo, ma la UX resta invariata.

## Build/Test eseguiti
- `npm run build` -> OK

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO

---

Regole template:
- niente codice
- niente diff
- linguaggio semplice e sintetico
