# REGISTRO MODIFICHE CLONE

## 2026-06-18 2049

DATA: `2026-06-18`
TITOLO: `Modale gomme manutenzioni NEXT`
FILE TOCCATI: `src/next/NextManutenzioniPage.tsx`, `src/next/components/NextModalGomme.tsx`, `src/next/domain/nextManutenzioniDomain.ts`, `src/next/domain/nextGommeSelectionReadOnly.ts`
COSA: `Nel form /next/manutenzioni la selezione gomme usa il modale visuale clone-safe equivalente all'app autisti, in inserimento, modifica e completamento. Il record @manutenzioni salva anche la nuova shape additiva gommeSelezione, usata dal dettaglio tecnico.`
ESITO: `FATTO`
NOTE: `Verifiche: tsc, test mirati, lint mirato e build canonica.`

## 2026-06-17 1520

DATA: `2026-06-17`
TITOLO: `Export PDF scadenze NEXT`
FILE TOCCATI: `src/next/NextScadenzeCollaudiPage.tsx`, `src/next/nextScadenzePdf.ts`, `src/next/next-scadenze.css`, `src/next/__tests__/nextScadenzePdf.test.ts`
COSA: `Aggiunto export PDF locale per /next/scadenze-collaudi con filtro categoria e anteprima condivisa. Il builder PDF e' isolato e non modifica il motore PDF condiviso o la write barrier.`
ESITO: `FATTO`
NOTE: `Verifiche: lint mirato, vitest mirato, build canonica.`

## 2026-06-17 1611

DATA: `2026-06-17`
TITOLO: `Stile aziendale PDF scadenze`
FILE TOCCATI: `src/next/nextScadenzePdf.ts`, `src/next/__tests__/nextScadenzePdf.test.ts`, `CONTEXT_CLAUDE.md`, `docs/_live/REGISTRO_MODIFICHE_CLONE.md`
COSA: `Allineato il PDF scadenze allo stile aziendale dei PDF esistenti: sfondo crema, header beige, logo, footer standard e tabelle separate per categoria. Evitata l'intestazione di categoria isolata a fondo pagina.`
ESITO: `FATTO`
NOTE: `Verifiche: lint mirato, vitest mirato, build canonica, render PDF pagine 1-2.`

## 2026-06-17 1548

DATA: `2026-06-17`
TITOLO: `Sezioni categoria PDF scadenze`
FILE TOCCATI: `src/next/nextScadenzePdf.ts`, `src/next/__tests__/nextScadenzePdf.test.ts`, `CONTEXT_CLAUDE.md`, `docs/_live/REGISTRO_MODIFICHE_CLONE.md`
COSA: `Nel PDF scadenze con filtro Tutte, la tabella viene divisa in sezioni per categoria mantenendo l'ordinamento operativo dentro ogni sezione. I filtri di categoria singola restano invariati.`
ESITO: `FATTO`
NOTE: `Verifiche: lint mirato, vitest mirato, build canonica.`
