# Continuity Report - 2026-04-08 23:39:44

## Ambito
- Modulo: `NEXT Manutenzioni`
- Prompt: `PROMPT 26`
- Focus: strutturare il cambio gomme per asse, mantenere retrocompatibilita clone-side e rendere il `Quadro manutenzioni PDF` leggibile per asse.

## Stato iniziale verificato
- Il record manutenzione NEXT gestiva al massimo `assiCoinvolti?: string[]`.
- Il modello risultava troppo generico per casi reali con cambi gomme su assi diversi in date/km differenti.
- Il `Quadro manutenzioni PDF` non costruiva uno stato finale gomme per asse.
- Il filtro `Attrezzature` non risultava presente nel selettore dedicato del quadro.

## Continuita garantita
- Nessuna modifica a viewer tecnico, `Calibra`, marker o coordinate override.
- Nessuna modifica a `NextMappaStoricoPage.tsx`, `nextMappaStoricoDomain.ts` o `mezziHotspotAreas.ts`.
- Nessuna modifica a madre legacy, backend, rules o PDF engine globale.
- Compatibilita retroattiva mantenuta:
  - i record vecchi senza `gommePerAsse` continuano a essere letti;
  - i record gomme legacy vengono ricostruiti in modo conservativo da `assiCoinvolti` e dai blocchi testo `CAMBIO GOMME`;
  - i record non gomme non vengono promossi artificialmente a stato gomme per asse.

## Stato finale verificato
- Nuovo campo retrocompatibile nel record NEXT:
  - `gommePerAsse?: { asseId; dataCambio; kmCambio }[]`
- Assi canonici riusati dal repo:
  - `anteriore`
  - `posteriore`
  - `asse1`
  - `asse2`
  - `asse3`
- In `Nuova / Modifica` il cambio gomme viene registrato per asse in modo esplicito.
- Nel `Quadro manutenzioni PDF` il filtro `Attrezzature` e presente.
- Nel quadro, per i mezzi motorizzati, ogni asse mostra:
  - data cambio
  - km cambio
  - km attuali da reader canonico rifornimenti
  - km percorsi dal cambio, se affidabili
- Nel quadro, per semirimorchi/rimorchi, il focus resta sulla data cambio per asse.

## File runtime toccati
- `src/next/NextManutenzioniPage.tsx`
- `src/next/domain/nextManutenzioniDomain.ts`
- `src/next/domain/nextManutenzioniGommeDomain.ts`
- `src/next/next-mappa-storico.css`

## Reader canonico riusato
- `readNextRifornimentiReadOnlySnapshot()` da `src/next/domain/nextRifornimentiDomain.ts`

## Verifiche eseguite
- `npx eslint src/next/NextManutenzioniPage.tsx src/next/domain/nextManutenzioniDomain.ts src/next/domain/nextManutenzioniGommeDomain.ts src/next/domain/nextRifornimentiDomain.ts`
- `npm run build`

## Esito
- `PARZIALE`
- Il flusso gomme per asse e ora strutturato e leggibile nel quadro, ma il modulo non va dichiarato chiuso: resta necessario il controllo runtime finale nel browser sul caso reale multi-asse e sulle combinazioni categoria/km.
