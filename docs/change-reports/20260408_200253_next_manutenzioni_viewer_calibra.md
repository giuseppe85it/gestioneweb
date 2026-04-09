# Change Report - 2026-04-08 20:02:53

## Modulo
- `Manutenzioni` NEXT -> tab `Dettaglio`

## Obiettivo
- Ripulire il viewer tecnico nelle viste `Sinistra/Destra`, eliminare i marker neutri in modalita normale e introdurre una modalita `Calibra` separata.

## File toccati
- `src/next/NextMappaStoricoPage.tsx`
- `src/next/mezziHotspotAreas.ts`
- `src/next/next-mappa-storico.css`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `CONTEXT_CLAUDE.md`

## Cambiamenti applicati
- Aggiunta tassonomia `targetKind` agli hotspot (`assi`, `fanali_specchi`, `attrezzature`).
- Viewer tecnico embedded pulito: in modalita normale mostra solo immagine tecnica + highlight reali degli assi.
- Introdotta modalita `Calibra` con preview asse e grammatica target.
- Marker distinti per hotspot e palette tecnica in base alla categoria target.

## Verifiche richieste
- `npx eslint src/next/NextMappaStoricoPage.tsx src/next/domain/nextMappaStoricoDomain.ts src/next/domain/nextManutenzioniGommeDomain.ts src/next/mezziHotspotAreas.ts`
- `npm run build`
