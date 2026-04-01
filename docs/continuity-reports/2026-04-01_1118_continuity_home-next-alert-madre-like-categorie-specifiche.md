# CONTINUITY REPORT - Home NEXT Alert madre-like per categoria

- RUN: 2026-04-01
- TEMA: Home NEXT, card `Alert`.
- STATO INIZIALE:
  - filtro visibile gia presente;
  - `Revisioni` semplificate;
  - `Segnalazioni` e `Eventi autisti` non ancora allineati al comportamento madre.
- STATO FINALE:
  - card unica mantenuta;
  - `Revisioni` con modal revisione + pre-collaudo;
  - `Segnalazioni` aperte come dettaglio evento;
  - `Eventi autisti` mostrati come lista ordinata con modal completo.
- BLOCCI REALI:
  - nessuno nuovo; il perimetro resta confinato a `src/next/*`.
- PATH PRECISI:
  - `src/next/NextCentroControlloPage.tsx`
  - `src/next/components/HomeAlertCard.tsx`
- VERIFICA:
  - `npm run build` -> `OK`.
