# Change Report

- Data: 2026-04-08
- Task: PROMPT 26
- Modulo: `Manutenzioni` NEXT
- Rischio: `ELEVATO`

## Obiettivo
- Strutturare il cambio gomme per asse nel clone NEXT `Manutenzioni`.
- Aggiungere il filtro `Attrezzature` nel `Quadro manutenzioni PDF`.
- Mostrare nel quadro lo stato gomme finale per asse, usando il reader canonico dei km attuali da rifornimenti.

## File toccati
- `src/next/NextManutenzioniPage.tsx`
- `src/next/domain/nextManutenzioniDomain.ts`
- `src/next/domain/nextManutenzioniGommeDomain.ts`
- `src/next/next-mappa-storico.css`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `CONTEXT_CLAUDE.md`

## Modifica applicata
- Introdotto nel record manutenzione il campo opzionale clone-side `gommePerAsse`.
- Mantenuto `assiCoinvolti` per compatibilita retroattiva.
- Il form `Nuova / Modifica` costruisce ora il payload per asse solo nel flusso `gomme`.
- Il `Quadro manutenzioni PDF` mostra lo stato finale gomme per asse e include il filtro `Attrezzature`.

## Impatto
- Nessuna modifica a viewer tecnico, madre, backend o writer fuori perimetro.
- Contratto dati esteso solo nel clone NEXT e letto in modo retrocompatibile.

## Verifiche
- `npx eslint src/next/NextManutenzioniPage.tsx src/next/domain/nextManutenzioniDomain.ts src/next/domain/nextManutenzioniGommeDomain.ts src/next/domain/nextRifornimentiDomain.ts` -> OK
- `npm run build` -> OK

## Stato finale
- `Manutenzioni` NEXT resta `PARZIALE`
