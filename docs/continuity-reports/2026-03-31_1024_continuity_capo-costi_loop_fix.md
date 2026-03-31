# Continuity Report - `Capo Costi` loop fix

- Timestamp: `2026-03-31 10:24 Europe/Rome`
- Stato lasciato dal run:
  - `/next/capo/costi/:targa` monta `NextCapoCostiMezzoPage` madre-like;
  - il runtime ufficiale legge `readNextCapoCostiMezzoSnapshot(targa, { includeCloneApprovals: false, includeCloneDocuments: false })`, quindi senza overlay clone-only su approvazioni o documenti;
  - `APPROVA`, `RIFIUTA`, `DA VALUTARE` e `ANTEPRIMA TIMBRATO` restano visibili ma bloccati con messaggio read-only esplicito;
  - il runtime ufficiale non usa piu `upsertNextCapoCloneApproval()` e non genera PDF timbrati clone-side.
- Audit separato: `PASS`
- Tracker aggiornato: `Capo Costi -> CLOSED`
- Prossimo modulo da affrontare: `IA Home`
