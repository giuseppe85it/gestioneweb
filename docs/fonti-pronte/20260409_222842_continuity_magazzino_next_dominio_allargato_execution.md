# Continuity Report - 2026-04-09 22:28:42

## Contesto
Execution strutturale sul dominio `Magazzino NEXT`, successiva all'audit che aveva confermato la copertura del core operativo locale ma anche i gap reali su documenti, costi materiali, collegamenti dossier e compatibilita cross-modulo.

## Stato prima
- `/next/magazzino` copriva bene `Inventario`, `Materiali consegnati` e `Cisterne AdBlue` come modulo locale.
- Il modulo riscriveva i dataset con shape piu povera dei writer esterni.
- Mancava una vista integrata read-only per `@documenti_magazzino`, costi materiali e procurement.
- I link e i grouping per dossier/materiali restavano piu fragili del necessario.

## Stato dopo
- `/next/magazzino` resta il runtime centrale del dominio e aggiunge la quarta vista `Documenti e costi`.
- Il modulo preserva shape/raw dei dataset storage-style multi-writer e scrive payload materiali piu compatibili con i reader esterni.
- I redirect di compatibilita convergono sul path canonico `/next/magazzino?tab=...`.
- `@documenti_magazzino`, costi materiali e procurement entrano nel modulo solo in forma leggibile e collegata, senza nuovi writer.
- I raggruppamenti materiali verso mezzo risultano meno fragili grazie alla normalizzazione per targa canonica.

## Vincoli mantenuti
- Nessuna modifica alla madre legacy
- Nessuna riapertura di moduli NEXT vecchi come runtime principali
- Nessun widening del barrier fuori dal perimetro gia autorizzato
- Nessuna auto-certificazione del modulo come `CHIUSO`

## Verifiche
- Lint mirato `OK`
- Build `OK`
- Preview runtime verificata sui path canonici e sulla nuova vista `Documenti e costi`

## Continuita per task futuri
- Il modulo `Magazzino NEXT` va ora considerato il centro operativo NEXT del dominio, con copertura locale piu ampia e sezione documentale/costi in sola lettura.
- Il costo materiali resta `DA VERIFICARE` come dato canonico: oggi e supporto prudente, non ledger transazionale.
- La chiusura del dominio richiede ancora audit separato su cross-modulo, PDF e writer esterni.
