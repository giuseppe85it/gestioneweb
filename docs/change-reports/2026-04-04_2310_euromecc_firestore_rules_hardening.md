# Change Report - 2026-04-04 23:10

## Modifica
- Hardening del perimetro sicurezza Firestore del modulo nativo NEXT `Euromecc`.

## Obiettivo
- Versionare nel repository regole Firestore esplicite per le collection dedicate `Euromecc`, senza fingere una matrice per-ruolo che il codice non dimostra oggi.

## File toccati
- `firestore.rules`
- `firebase.json`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `CONTEXT_CLAUDE.md`

## Dettaglio
- creato `firestore.rules`;
- aggiunti `match` espliciti per:
  - `euromecc_pending`
  - `euromecc_done`
  - `euromecc_issues`
  - `euromecc_area_meta`
- tutte le collection Euromecc richiedono `request.auth != null`;
- le scritture Euromecc vengono validate anche per shape e tipi campi attesi dal domain;
- `firebase.json` punta ora esplicitamente al file `firestore.rules`;
- il fallback resto-app resta `request.auth != null`, coerente con il modello auth reale oggi dimostrato dal repo.

## Impatto
- nessuna modifica a UI, route o domain runtime;
- il boundary Firestore Euromecc e ora verificabile nel repo;
- il modello sicurezza per-ruolo resta fuori chiusura, perche il repo dimostra solo auth anonima globale.

## Verifiche
- presenza di `firestore.rules` nel repo -> `OK`
- presenza di `firestore.rules` in `firebase.json` -> `OK`
- `npm run build` -> `OK`
- validazione locale Firebase senza deploy -> `DA VERIFICARE`, tooling dedicato non governato dal repo
