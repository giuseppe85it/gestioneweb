# Change Report

## Data
2026-04-01

## Ambito
Audit documentale definitivo sui moduli procurement secondari NEXT:

- `Ordini in attesa`
- `Ordini arrivati`
- `Dettaglio ordine`

## File creati
- `docs/audit/AUDIT_PROCUREMENT_MODULI_RIMOVIBILI_NEXT.md`
- `docs/audit/MATRICE_PROCUREMENT_RIMOZIONE_NEXT.md`
- `docs/audit/BACKLOG_PROCUREMENT_DA_RIMUOVERE_O_DECLASSARE.md`

## Sintesi
Audit completato sul runtime NEXT e sui collegamenti reali della famiglia procurement. La conclusione documentata e:

- `Materiali da ordinare` resta il padre top-level procurement;
- `Ordini in attesa`, `Ordini arrivati` e `Dettaglio ordine` non vanno piu trattati come ingressi top-level;
- i tre moduli restano pero necessari come superfici secondarie/runtime di supporto;
- nessuno dei tre e oggi candidabile a rimozione codice senza refactor esplicito del workbench procurement e dei mapper collegati.

## Modifiche runtime
Nessuna.
