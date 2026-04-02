# Change Report - 2026-04-01 23:55

## Oggetto
Audit documentale sulla famiglia procurement per distinguere padre vs sottomoduli tra madre e NEXT.

## File creati
- `docs/audit/AUDIT_PROCUREMENT_PADRE_VS_SOTTOMODULI.md`
- `docs/audit/MATRICE_PROCUREMENT_INGRESSI_E_FLUSSI.md`
- `docs/audit/BACKLOG_DECISIONE_PROCUREMENT_NEXT.md`

## Contenuto
- verificata la mappa route procurement madre e NEXT;
- verificata la differenza tra padre reale nella madre (`Acquisti`) e ingresso top-level consigliato nella NEXT (`Materiali da ordinare`);
- classificati `Ordini in attesa`, `Ordini arrivati` e `Dettaglio ordine` come autonomi nella madre ma secondari nella NEXT.

## Runtime
- nessuna modifica runtime;
- nessuna route cambiata;
- nessun file `src/*` toccato.
