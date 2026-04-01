# Change Report - 2026-04-01 14:20

## Contesto
- Prompt 6 in `MODE = OPERAIO`.
- Perimetro ammesso: `src/next/NextCentroControlloPage.tsx` e documentazione clone.
- Obiettivo: eliminare il payload sintetico della categoria `Segnalazioni` nella card `Alert` della Home NEXT e riallineare il dettaglio al comportamento reale della madre.

## Verifica preliminare nel codice
- Madre letta senza modifiche:
  - `src/pages/Home.tsx`
  - `src/components/AutistiEventoModal.tsx`
- Runtime NEXT letto:
  - `src/next/NextCentroControlloPage.tsx`
  - `src/next/components/NextHomeAutistiEventoModal.tsx`
  - `src/next/domain/nextCentroControlloDomain.ts`
  - `src/next/domain/nextUnifiedReadRegistryDomain.ts`
- Fatti verificati:
  - la madre apre il dettaglio segnalazione tramite `AutistiEventoModal` con `HomeEvent.payload = record` reale;
  - il modale usa campi completi del payload (`tipoProblema`, `descrizione`, `note/messaggio`, `urgenza/priorita/gravita/severity`, `stato`, foto, export PDF);
  - la NEXT costruiva invece `buildSyntheticSegnalazioneEvent(alert)` solo dai campi dell'alert;
  - il clone read-only puo leggere il dataset reale `@segnalazioni_autisti_tmp` tramite `readNextUnifiedStorageDocument()`.

## Modifica applicata
- In `src/next/NextCentroControlloPage.tsx`:
  - aggiunta lettura dei record reali `@segnalazioni_autisti_tmp`;
  - aggiunto lookup locale madre-like dei record segnalazione con `sourceRecordId` esplicito o hash fallback coerente con il dominio NEXT;
  - sostituito l'uso di `buildSyntheticSegnalazioneEvent(alert)` nel click `Segnalazioni`;
  - il click apre ora `NextHomeAutistiEventoModal` con un `HomeEvent` costruito dal record reale, quindi con payload completo.

## File toccati
- `src/next/NextCentroControlloPage.tsx`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/change-reports/2026-04-01_1420_home-next-alert-segnalazioni-payload-reale-madre-like.md`
- `docs/continuity-reports/2026-04-01_1420_continuity_home-next-alert-segnalazioni-payload-reale-madre-like.md`

## Esito verifica
- Build eseguita con `npm run build`: OK.
- Warning residui preesistenti: `jspdf` e chunk size Vite.

## Limiti residui
- Se il clone non trova il record reale corrispondente all'alert, il dettaglio segnala indisponibilita nel clone read-only invece di inventare un payload sintetico.
