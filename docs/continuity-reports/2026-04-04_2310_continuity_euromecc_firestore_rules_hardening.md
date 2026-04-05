# Continuity Report - 2026-04-04 23:10

## Contesto
- Modulo: `Euromecc`
- Focus: hardening Firestore lato repository

## Stato iniziale
- `firestore.rules` assente nel repo
- `firebase.json` senza riferimento a regole Firestore versionate
- boundary sicurezza Euromecc non verificabile da file versionati

## Intervento
- creato `firestore.rules`
- collegato `firebase.json` al file regole
- aggiunte regole esplicite per le 4 collection Euromecc
- base auth chiusa sul modello oggi dimostrato: `request.auth != null`
- aggiunta validazione shape/tipi per i documenti Euromecc
- lasciato il fallback resto-app coerente con il modello auth corrente, senza introdurre ruoli/claims non dimostrati

## Stato finale
- il boundary Firestore Euromecc e chiuso nel repo per il modello auth attuale
- il repo continua a non dimostrare ruoli/claims server-side o login admin dedicati

## Prossima continuita
- stato modulo `Euromecc` resta `PARZIALE`
- sicurezza per-ruolo ancora aperta
- resta da estendere la stessa disciplina ai dataset Firestore non-Euromecc e a `storage.rules`
