# CHANGE REPORT - Importa documenti layout approvato allineato

## Obiettivo
Unire la logica gia decisa di Archivista con il layout approvato di `docs/product/SPEC_UI_LAYOUT_IMPORTA_DOCUMENTI.md`, senza rifare Magazzino, senza trasformare IA 2 in chat e senza toccare backend o barrier.

## Perimetro
- `src/next/NextIAArchivistaPage.tsx`
- `src/next/internal-ai/ArchivistaMagazzinoBridge.tsx`
- `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx`
- `src/next/internal-ai/internal-ai.css`

## Modifiche reali
- rinominata la superficie visibile in `Importa documenti`;
- introdotta testata compatta con CTA `Vai a IA Report` e menu secondario `...`;
- ricomposta la fascia alta in tre aree desktop affiancate:
  - `Tipo documento`
  - `Contesto`
  - `Upload + Analizza`
- introdotto shell desktop con:
  - preview documento a sinistra
  - dati estratti a destra
  - tabella righe sotto
  - convalida finale in basso
- ricomposti nel nuovo ordine visuale i rami:
  - `Fattura / DDT + Magazzino`
  - `Fattura / DDT + Manutenzione`
- aggiunti controlli preview locali `Zoom +`, `Zoom -`, `Ruota`;
- resa esplicita in tabella la selezione delle righe da archiviare nei due rami toccati.

## Non fatto
- nessuna patch a backend IA;
- nessuna patch a `cloneWriteBarrier.ts`;
- nessuna modifica a writer business;
- nessun refactor dei motori Magazzino o Manutenzione;
- nessuna rifinitura dedicata dei bridge `Documento mezzo` e `Preventivo + Magazzino`.

## Verifiche
- `npx eslint src/next/NextIAArchivistaPage.tsx src/next/internal-ai/ArchivistaMagazzinoBridge.tsx src/next/internal-ai/ArchivistaManutenzioneBridge.tsx` -> `OK`
- `npx eslint src/next/internal-ai/internal-ai.css` -> warning noto: file ignorato dalla config ESLint
- `npm run build` -> `OK`

## Rischio
- `NORMALE`
- impatto confinato alla UI/layout Archivista NEXT;
- logica business e backend non toccati.
