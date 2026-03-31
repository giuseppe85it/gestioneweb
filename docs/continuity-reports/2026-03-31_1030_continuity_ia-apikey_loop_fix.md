# Continuity Report - `IA API Key` loop fix

- Timestamp: `2026-03-31 10:30 Europe/Rome`
- Stato lasciato dal run:
  - `/next/ia/apikey` monta `NextIAApiKeyPage` madre-like;
  - il runtime ufficiale legge lo stesso documento `@impostazioni_app/gemini`;
  - `Salva chiave` resta visibile ma bloccato con messaggio read-only esplicito;
  - `saveNextIaConfigSnapshot()` non scrive piu in Firestore.
- Audit separato: `PASS`
- Tracker aggiornato: `IA API Key -> CLOSED`
- Prossimo modulo da affrontare: `IA Libretto`
