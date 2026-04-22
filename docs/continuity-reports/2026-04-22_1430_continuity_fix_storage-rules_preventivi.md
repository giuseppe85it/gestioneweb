# CONTINUITY REPORT - 2026-04-22 14:30 - continuity fix storage rules preventivi

## Stato iniziale

La regola Firebase Storage per `preventivi/` era assente da sempre: il file `storage.rules` non l'aveva mai contenuta in nessun commit. Il cloneWriteBarrier era gia correttamente configurato. Entrambi i rami Archivista Preventivo ricevevano `storage/unauthorized` da Firebase al momento del tentativo di upload.

## Continuita garantita

- nessun file sorgente toccato
- `src/utils/cloneWriteBarrier.ts` invariato
- `src/next/internal-ai/ArchivistaArchiveClient.ts` invariato
- `src/next/internal-ai/ArchivistaPreventivoMagazzinoBridge.tsx` invariato
- `src/next/internal-ai/ArchivistaPreventivoManutenzioneBridge.tsx` invariato
- nessuna apertura di nuovi path Firebase Storage oltre `preventivi/`
- nessuna modifica a regole Firestore

## Stato finale

### Ramo `Preventivo -> Manutenzione`

- **storage.rules**: `preventivi/` ora autorizzato per utenti autenticati
- **barrier**: gia corretto, nessuna modifica necessaria
- **upload**: ora raggiunge Firebase e dovrebbe completare
- **stato**: OPERATIVO END-TO-END — pendente verifica runtime con preventivo reale

### Ramo `Preventivo -> Magazzino`

- **storage.rules**: idem, stesso path `preventivi/`, stessa regola
- **barrier**: gia corretto, nessuna modifica necessaria
- **upload**: ora effettivamente scrivibile su Storage per la prima volta in questo ambiente
- **stato**: OPERATIVO END-TO-END — pendente verifica runtime con preventivo reale

## Debito noto

- Verifica runtime dei due rami da eseguire quando disponibile un preventivo reale (PDF o immagine).
- Record gia archiviati in `storage/@preventivi` con family `preventivo_magazzino` dal ramo manutenzione (prima della distinzione esplicita del 2026-04-22) restano invariati: debito noto documentato nel change-report precedente sulla distinzione family.

## Esito

- `STORAGE PREVENTIVI: SBLOCCATO`
- `RAMO PREVENTIVO MANUTENZIONE: OPERATIVO END-TO-END (pending runtime)`
- `RAMO PREVENTIVO MAGAZZINO: OPERATIVO END-TO-END (pending runtime)`
