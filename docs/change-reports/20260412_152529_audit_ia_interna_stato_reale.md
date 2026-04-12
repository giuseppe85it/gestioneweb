# CHANGE REPORT - AUDIT IA INTERNA STATO REALE

- Data: 2026-04-12
- Tipo: audit documentale
- Obiettivo: fotografare in modo semplice e dimostrabile cosa fa oggi la IA interna/documentale dal codice reale del repo e dal runtime reale, senza patch runtime.

## File creati
- `docs/audit/AUDIT_IA_INTERNA_STATO_REALE_2026-04-12.md`
- `docs/change-reports/20260412_152529_audit_ia_interna_stato_reale.md`
- `docs/continuity-reports/20260412_152529_continuity_audit_ia_interna_stato_reale.md`

## File documentali aggiornati
- `docs/STATO_ATTUALE_PROGETTO.md`
- `CONTEXT_CLAUDE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`

## Cosa e stato verificato davvero
- Home `/next`: il launcher IA apre direttamente `/next/ia/interna`.
- `/next/ia/interna`: ingresso pulito senza review preaperta.
- Upload file reale: `audit-fattura-mariba.pdf`.
- Click `Analizza`: `POST` reale a `estrazioneDocumenti` partito con `200`.
- Review documento: aperta davvero con CTA `Apri originale`, `Vai a Inventario`, `Torna alla home documentale`.
- `Apri originale`: apre davvero un blob locale in nuova tab per il file appena caricato.
- `/next/ia/documenti`: filtri storici visibili, pulsanti `Apri originale`, `Riapri review`, `Vai a` visibili.
- `Riapri review`: riapre davvero un documento storico dentro `/next/ia/interna`.
- `Vai a`: verificato davvero `Inventario`; verificato il target URL del preventivo e la route diretta dossier.

## Esito audit
- La IA interna oggi funziona come ingresso documentale unico della NEXT.
- Il motore reale dietro il flusso resta `useIADocumentiEngine()` in `src/pages/IA/IADocumenti.tsx`.
- Le scritture documentali reali esistono nel codice: analisi cloud function, upload Storage, salvataggio Firestore, update valuta, import inventario.
- Le scritture IA non business esistono nel codice: tracking locale, artifact archive locale, richieste universali locali e mirror opzionale su adapter server-side isolato.
- Problemi reali ancora presenti nel runtime: errori `403` su listing Storage Firebase e ricorrenze `Maximum update depth exceeded`.

## Impatto
- Nessun file runtime toccato.
- Nessuna build o lint richieste, perche il task e solo audit documentale.
- Il nuovo report diventa base di lavoro per decidere la UI definitiva senza altre patch a tentativi.
