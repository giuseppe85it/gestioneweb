# Change Report - 2026-04-08 17:47:18

## Obiettivo
Introdurre nel modulo NEXT `Manutenzioni` un flusso gomme/assi inline, senza riaprire il modale legacy:
- selezione assi in `Nuova / Modifica`;
- salvataggio strutturato `assiCoinvolti?: string[]`;
- tavola tecnica reale `Sinistra/Destra` in `Dettaglio` con highlight automatico assi.

## File toccati
- `src/next/NextManutenzioniPage.tsx`
- `src/next/NextMappaStoricoPage.tsx`
- `src/next/domain/nextManutenzioniDomain.ts`
- `src/next/domain/nextManutenzioniGommeDomain.ts`
- `src/next/next-mappa-storico.css`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `CONTEXT_CLAUDE.md`

## Modifiche applicate
- Esteso il contratto manutenzione NEXT con `assiCoinvolti?: string[]`, retrocompatibile sui record legacy.
- Aggiunti helper NEXT-only per:
  - normalizzazione id asse canonici;
  - risoluzione assi disponibili per categoria;
  - mapping categoria -> tavola tecnica reale `public/gomme/*`;
  - costruzione geometria ruote per highlight asse completo.
- Rimossa dalla pagina `Manutenzioni` la dipendenza runtime da `NextModalGomme`.
- Inserita selezione assi inline nella tab `Nuova / Modifica`.
- Agganciato il tab `Dettaglio` al viewer tecnico per `Sinistra/Destra`, lasciando `Fronte/Retro` sul fallback attuale foto/hotspot.
- Aggiunto styling locale per chip assi, viewer tecnico e highlight.

## Verifiche eseguite
- `npx eslint src/next/NextManutenzioniPage.tsx src/next/NextMappaStoricoPage.tsx src/next/domain/nextManutenzioniDomain.ts src/next/domain/nextMappaStoricoDomain.ts src/next/domain/nextManutenzioniGommeDomain.ts`
- `npm run build`

## Esito
- Patch runtime completata senza toccare madre, modale legacy, PDF o altri moduli.
- Stato modulo `Manutenzioni`: `PARZIALE`.
