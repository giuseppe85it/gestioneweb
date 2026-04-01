# Change Report - 2026-04-01 20:15

## Tipo intervento
Audit documentale. Nessuna patch runtime.

## File creati
- `docs/audit/AUDIT_HOME_FLUSSI_MODULI_INGRESSI.md`
- `docs/audit/MATRICE_HOME_MODULI_DECISIONI.md`
- `docs/audit/BACKLOG_HOME_RIDUZIONE_RUMORE.md`

## Fonti verificate
- `AGENTS.md`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/architecture/PROCEDURA_MADRE_TO_CLONE.md`
- `docs/data/MAPPA_COMPLETA_DATI.md`
- `docs/data/DOMINI_DATI_CANONICI.md`
- `docs/data/REGOLE_STRUTTURA_DATI.md`
- documenti `docs/flow-master/*` pertinenti
- `src/App.tsx`
- moduli NEXT principali sotto `src/next/*` collegati a Home, Navigazione rapida, autisti, IA, procurement, dossier, manutenzioni e cisterna

## Esito
Creato audit strutturato sui flussi Home con:
- schede modulo complete;
- matrice decisionale sintetica;
- backlog di riduzione rumore;
- distinzione esplicita tra fatti verificati e raccomandazioni.

## Risultato chiave
La Home deve restare cockpit sintetico. I moduli completi e gli accessi specialistici vanno spostati in Navigazione rapida, menu, ricerca o modulo padre.
