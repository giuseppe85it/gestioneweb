# Change Report - 2026-04-08 21:21:25

## Titolo
Fix runtime visibilita `Attrezzature` + `Calibra` in `Manutenzioni` NEXT

## Obiettivo
Correggere il runtime reale del modulo `/next/manutenzioni` per esporre davvero:
- la terza opzione `Attrezzature` nel form `Nuova / Modifica`;
- il comando `Calibra` nel toolbar tecnico del tab `Dettaglio`.

## File toccati
- `src/next/NextManutenzioniPage.tsx`
- `src/next/NextMappaStoricoPage.tsx`
- `src/next/domain/nextManutenzioniDomain.ts`
- `src/next/next-mappa-storico.css`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `CONTEXT_CLAUDE.md`

## Cambio applicato
- Audit locale del runtime:
  - `Attrezzature` non era presente nel JSX del form;
  - `Calibra` esisteva nel viewer embedded ma il bottone era montato con variante secondaria trasparente, poco leggibile su superficie chiara.
- `NextManutenzioniPage.tsx`:
  - aggiunta l'opzione `Attrezzature` nel select `Tipo`.
- `nextManutenzioniDomain.ts`:
  - esteso in modo retrocompatibile il tipo manutenzione a `attrezzature`.
- `NextMappaStoricoPage.tsx`:
  - il comando toolbar del viewer tecnico usa ora una variante esplicita per il ramo `Calibra`.
- `next-mappa-storico.css`:
  - resa visibile la variante secondaria su superfici chiare;
  - aggiunta variante dedicata `viewer`;
  - aggiunto badge visuale per `attrezzature`.

## Impatto
- UI: i controlli attesi risultano finalmente visibili nel runtime reale.
- Logica dati: nessun contratto distruttivo; supporto clone-side retrocompatibile del nuovo valore `attrezzature`.
- Perimetro: nessun cambio a madre, PDF, Euromecc o moduli fuori whitelist.

## Verifiche
- `npx eslint src/next/NextManutenzioniPage.tsx src/next/NextMappaStoricoPage.tsx src/next/domain/nextManutenzioniDomain.ts src/next/domain/nextMappaStoricoDomain.ts src/next/domain/nextManutenzioniGommeDomain.ts src/next/mezziHotspotAreas.ts` -> `OK`
- `npm run build` -> `OK`

## Stato
- `Manutenzioni` resta `PARZIALE`.
