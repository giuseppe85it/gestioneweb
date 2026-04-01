# Change Report - 2026-04-01 21:00

## Tipo intervento
Audit documentale. Nessuna patch runtime.

## File creati
- `docs/audit/ELENCO_COMPLETO_MODULI_GESTIONALE.md`
- `docs/audit/MATRICE_COMPLETA_MODULI_GESTIONALE.md`
- `docs/audit/BACKLOG_MODULI_DA_CLASSIFICARE.md`

## Metodo
- Censimento partito dalle route reali in `src/App.tsx`.
- Mapping route -> file runtime -> famiglia -> perimetro.
- Distinzione tra moduli utente, hub, dettagli e supporti tecnici.
- Evidenza separata di moduli solo madre, solo NEXT, presenti in entrambe e casi duplicati/equivalenti.

## Esito
Prodotta una base affidabile per sapere quali moduli esistono davvero nel gestionale e come sono distribuiti tra madre, NEXT e supporti di routing.
