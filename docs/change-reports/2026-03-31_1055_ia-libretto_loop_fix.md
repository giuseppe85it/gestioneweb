# Change Report - 2026-03-31 10:55 - IA Libretto loop fix

## Obiettivo

Chiudere il modulo `IA Libretto` della NEXT come clone fedele read-only della madre su `/next/ia/libretto`, senza toccare la madre e senza lasciare upload, save o patch clone-only attivi nel runtime ufficiale.

## Perimetro

- `src/next/NextIALibrettoPage.tsx`
- `src/next/domain/nextIaLibrettoDomain.ts`
- documentazione loop/audit/stato clone collegata al modulo

## Modifiche eseguite

- riscritta `src/next/NextIALibrettoPage.tsx` con grammatica pratica madre-like su header, step, upload, analisi, risultati, archivio e viewer;
- rimosse dal runtime ufficiale tutte le dipendenze clone-specifiche:
  - `NextClonePageScaffold`
  - handoff IA dedicato
  - preview facade locale strutturale
  - `upsertNextFlottaClonePatch()`
- introdotto `src/next/domain/nextIaLibrettoDomain.ts` per leggere in sola lettura l'archivio reale `storage/@mezzi_aziendali`;
- mantenute visibili le CTA madre `Analizza con IA` e `Salva nei documenti del mezzo`, ma con blocco read-only esplicito e senza side effect.

## Dati letti davvero

- `@impostazioni_app/gemini` tramite `readNextIaConfigSnapshot()`
- `storage/@mezzi_aziendali` tramite `readNextIaLibrettoArchiveSnapshot()`

## Verifiche

- `npx eslint src/next/NextIALibrettoPage.tsx src/next/domain/nextIaLibrettoDomain.ts src/next/domain/nextIaConfigDomain.ts`
- `npm run build`

Esito: `OK`, con warning preesistenti su `baseline-browser-mapping`, `jspdf` e chunk size.

## Esito modulo

- Audit separato: `PASS`
- Tracker: `IA Libretto` marcato `CLOSED`
- Prossimo modulo del loop: `IA Documenti`
