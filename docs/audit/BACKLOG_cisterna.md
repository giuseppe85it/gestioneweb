# BACKLOG - `Cisterna`

- Modulo target: `Cisterna`
- Route target:
  - `/next/cisterna`
- Stato iniziale: `NOT_STARTED`
- Stato finale: `CLOSED`
- Blocchi reali rilevati:
  - `src/next/NextCisternaPage.tsx` non usa piu `NextClonePageScaffold`, `jsPDF`, `jspdf-autotable`, `pdf.save(...)` o `upsertNextCisternaCloneParametro()`.
  - Il runtime ufficiale replica ora la grammatica pratica della madre su header, month picker, archivio, `DOPPIO BOLLETTINO`, report mensile, targhe e dettaglio.
  - `src/next/domain/nextCisternaDomain.ts` espone ora `readNextCisternaSnapshot(..., { includeCloneOverlays: false })`, cosi la route ufficiale legge documenti, schede e parametri reali senza overlay clone-only.
  - `Salva`, `Conferma scelta`, `Apri IA Cisterna`, `Scheda carburante`, `Apri/Modifica` ed `Esporta PDF` restano visibili ma bloccano il comportamento con messaggi read-only espliciti.
- Path precisi:
  - `src/next/NextCisternaPage.tsx`
  - `src/next/domain/nextCisternaDomain.ts`
  - `src/pages/CisternaCaravate/CisternaCaravatePage.tsx`
