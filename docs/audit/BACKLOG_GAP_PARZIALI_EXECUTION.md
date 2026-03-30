# BACKLOG GAP PARZIALI EXECUTION

## Scopo
Backlog esecutivo persistente dei soli moduli `PARZIALI` emersi da `docs/audit/AUDIT_FINALE_POST_PROMPT_42_NEXT_AUTONOMA.md`.

## Stato run 2026-03-30

| Modulo target | Stato iniziale | Stato finale | Gap parziale chiuso | Blocco reale |
| --- | --- | --- | --- | --- |
| Inventario | PARZIALE | CHIUSO | Abilitati add/edit/delete, variazione quantita, foto e anteprima PDF nel clone NEXT sopra `nextInventarioCloneState` e `nextInventarioDomain`. | - |
| Materiali / Materiali consegnati / blocchi materiali collegati | PARZIALE | CHIUSO | Abilitati registra consegna, delete con ripristino stock clone, PDF e merge domain locale sopra `nextMaterialiMovimentiCloneState`, `nextMaterialiMovimentiDomain` e `nextInventarioCloneState`. | - |
| Procurement | PARZIALE | CHIUSO | Confermata parity clone-safe dei flussi `Materiali da ordinare`, `Acquisti`, `Ordini`, `Dettaglio ordine`, `Preventivi`, `Listino` con writer solo locali e senza mount madre finale. | - |
| Lavori | PARZIALE | CHIUSO | Confermata parity clone-safe di apertura gruppo, liste, dettaglio, modifica, esecuzione, delete e PDF locali sul workflow NEXT. | - |
| Mezzi / Dossier | PARZIALE | CHIUSO | Route `/next/mezzi` resa nativa con save/delete/foto/libretto locali; il dossier legge ora le patch mezzo dal layer D01 senza runtime madre finale. | - |
| Capo Costi | PARZIALE | CHIUSO | Sostituito il timbro PDF reale con anteprima PDF clone locale; approvazioni e report restano nel perimetro NEXT senza endpoint business. | - |
| Colleghi | PARZIALE | CHIUSO | Confermato CRUD clone-safe completo con PDF locale e nessun mount madre finale. | - |
| Fornitori | PARZIALE | CHIUSO | Confermato CRUD clone-safe completo con PDF locale e nessun mount madre finale. | - |
| IA documentale / libretti | PARZIALE | CHIUSO | Confermati preview, salvataggio locale, import clone e coverage libretti nel perimetro NEXT senza OCR/provider o writer madre. | - |
| Cisterna | PARZIALE | CHIUSO | Confermati archivio, report, parametro cambio, IA cisterna e schede test come superfici NEXT clone-safe senza runtime madre finale. | - |
| Autisti | PARZIALE | CHIUSO | Confermati rifornimenti, segnalazioni, controlli, richieste e cambio mezzo come flussi clone-safe autonomi sulla shell NEXT. | - |
| Autisti Inbox / Admin | PARZIALE | CHIUSO | Confermati home inbox, liste admin e bridge clone-safe sopra layer NEXT e adapter locali, senza runtime madre finale. | - |

## Note operative
- Questo backlog chiude solo i moduli `PARZIALI`.
- I moduli `DA VERIFICARE` del perimetro target restano fuori da questo run.
- La chiusura di questo backlog non equivale a un nuovo verdetto di autonomia generale della NEXT.
