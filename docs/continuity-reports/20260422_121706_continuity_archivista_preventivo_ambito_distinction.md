# Continuity Report

## Scope
- `Archivista documenti -> Preventivo -> Magazzino / Preventivo -> Manutenzione`

## Continuita preservata
- nessun cambio a `NextIAArchivistaPage.tsx`
- nessun cambio alla UI dei bridge preventivo
- nessuna write in `@manutenzioni`
- nessuna write in `@documenti_mezzi`
- nessun cambio a `cloneWriteBarrier.ts`
- nessuna migrazione dei record gia presenti in `storage/@preventivi`

## Continuita dati
- la destinazione dati resta `storage/@preventivi` per entrambi i rami
- `Preventivo -> Magazzino` continua a usare family `preventivo_magazzino`
- `Preventivo -> Manutenzione` usa ora family dedicata `preventivo_manutenzione`
- il record archivista aggiunge in modo additivo `ambitoPreventivo`
- `metadatiMezzo` resta confinato al solo ramo manutenzione

## Continuita duplicate check
- il duplicate check del ramo magazzino resta confinato a `preventivo_magazzino`
- il duplicate check del ramo manutenzione e ora confinato a `preventivo_manutenzione`
- i due rami non condividono piu la stessa family di confronto

## Debito noto
- eventuali record storici creati prima di questa patch dal ramo manutenzione con family `preventivo_magazzino` restano invariati
- quel sottogruppo storico non viene migrato automaticamente e va trattato come debito dati noto

## Verifiche eseguite
- `npx eslint src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx src/next/internal-ai/ArchivistaArchiveClient.ts` -> `OK`
- `npm run build` -> `OK`
- `npm run lint` -> `KO` per errori globali preesistenti fuori perimetro

## Da verificare
- archiviazione reale di un preventivo magazzino con `famigliaArchivista = preventivo_magazzino` e `ambitoPreventivo = magazzino`
- archiviazione reale di un preventivo manutenzione con `famigliaArchivista = preventivo_manutenzione` e `ambitoPreventivo = manutenzione`
- isolamento effettivo dei duplicate check dei due rami su dataset reale
