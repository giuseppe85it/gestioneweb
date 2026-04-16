# Change Report - 2026-04-15 22:41:52

## Obiettivo
Integrare nella schermata reale `Importa documenti` il layout UI approvato, mantenendo invariata la logica attuale dei rami gia attivi e senza toccare backend, estrazione, writer o barrier.

## File runtime toccati
- `src/next/NextIAArchivistaPage.tsx`
- `src/next/internal-ai/ArchivistaMagazzinoBridge.tsx`
- `src/next/internal-ai/ArchivistaManutenzioneBridge.tsx`
- `src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx`
- `src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx`
- `src/next/internal-ai/internal-ai.css`

## Cosa e stato fatto
- allineato il naming visibile della pagina a `Importa documenti`;
- sostituita la scelta visiva `Tipo / Contesto` con la card unica `Destinazione rilevata`;
- innestato il sistema classi `iai-*` sulla pagina e sui bridge attivi;
- riallineati upload, viewer, campi, righe, duplicati e conferma finale alla grammatica del CSS approvato;
- preservata integralmente la logica documentale gia esistente.

## Cosa non e stato toccato
- backend IA;
- estrazione documentale;
- archiviazione/writer business;
- `cloneWriteBarrier.ts`;
- logica dei 4 rami V1 attivi.

## Verifiche
- `npx eslint src/next/NextIAArchivistaPage.tsx src/next/internal-ai/ArchivistaMagazzinoBridge.tsx src/next/internal-ai/ArchivistaManutenzioneBridge.tsx src/next/internal-ai/ArchivistaDocumentoMezzoBridge.tsx src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx` -> `OK`
- `npx eslint src/next/internal-ai/internal-ai.css` -> file ignorato dalla config ESLint
- `npm run build` -> `OK`
