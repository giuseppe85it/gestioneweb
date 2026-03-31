# Change Report - 2026-03-31 12:00 - Cisterna loop fix

## Obiettivo

Chiudere il modulo `Cisterna` della NEXT come clone fedele read-only della madre su `/next/cisterna`, senza toccare la madre e senza lasciare writer locali o export locale attivi nel runtime ufficiale.

## Perimetro

- `src/next/NextCisternaPage.tsx`
- `src/next/domain/nextCisternaDomain.ts`
- documentazione loop/audit/stato clone collegata al modulo

## Modifiche eseguite

- riscritta `src/next/NextCisternaPage.tsx` con grammatica pratica madre-like su header, month picker, archivio, `DOPPIO BOLLETTINO`, report mensile, targhe e dettaglio;
- rimosse dal runtime ufficiale tutte le dipendenze clone-specifiche:
  - `NextClonePageScaffold`
  - `upsertNextCisternaCloneParametro()`
  - `jsPDF`
  - `jspdf-autotable`
  - `pdf.save(...)`
- esteso `src/next/domain/nextCisternaDomain.ts` con `includeCloneOverlays`, cosi la route ufficiale usa `readNextCisternaSnapshot(..., { includeCloneOverlays: false })`;
- mantenute visibili le CTA madre `Salva`, `Conferma scelta`, `Apri IA Cisterna`, `Scheda carburante`, `Apri/Modifica` ed `Esporta PDF`, ma con blocco read-only esplicito e senza side effect.

## Dati letti davvero

- `cisterna_documenti`
- `cisterna_schede`
- `cisterna_parametri_mensili`
- `storage/@rifornimenti_autisti_tmp`

## Verifiche

- `npx eslint src/next/NextCisternaPage.tsx src/next/domain/nextCisternaDomain.ts`
- `npm run build`

Esito: `OK`, con warning preesistenti su `baseline-browser-mapping`, `jspdf` e chunk size.

## Esito modulo

- Audit separato: `PASS`
- Tracker: `Cisterna` marcato `CLOSED`
- Prossimo modulo del loop: `Cisterna IA`
