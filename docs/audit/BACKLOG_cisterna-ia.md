# BACKLOG - `Cisterna IA`

- Modulo target: `Cisterna IA`
- Route target:
  - `/next/cisterna/ia`
- Stato iniziale: `NOT_STARTED`
- Stato finale: `CLOSED`
- Blocchi reali rilevati:
  - `src/next/NextCisternaIAPage.tsx` era ancora clone-specifica con `NextClonePageScaffold`, banner handoff e salvataggi clone-only.
  - Il runtime ufficiale usava upload Storage, `extractCisternaDocumento()` e `addDoc()` per toccare la madre o simulare la parity.
  - La route ufficiale esponeva ancora affordance e copy del clone che non seguivano fino in fondo la grammatica pratica della madre.
  - Il nuovo runtime ufficiale mantiene la UI madre ma blocca `Analizza documento (IA)` e `Salva in archivio cisterna` in read-only esplicito.
- Path precisi:
  - `src/next/NextCisternaIAPage.tsx`
  - `src/pages/CisternaCaravate/CisternaCaravateIA.tsx`
  - `src/App.tsx`
