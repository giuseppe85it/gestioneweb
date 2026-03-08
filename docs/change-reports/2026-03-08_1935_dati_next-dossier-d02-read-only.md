# CHANGE REPORT - Primo blocco tecnico D02 nel Dossier NEXT read-only

## Data
- 2026-03-08 19:35

## Tipo task
- dati

## Obiettivo
- verificare il dominio `Operativita tecnica mezzo` e, risultando importabile in sola lettura, portare nel `Dossier Mezzo NEXT` il primo blocco tecnico reale su lavori e manutenzioni

## File modificati
- `src/next/nextOperativitaTecnicaDomain.ts`
- `src/next/NextDossierMezzoPage.tsx`
- `src/next/NextMezziDossierPage.tsx`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STORICO_DECISIONI_PROGETTO.md`

## Riassunto modifiche
- creato il reader canonico NEXT `D02` dedicato al dominio `Operativita tecnica mezzo`
- limitata la lettura a `@lavori` e `@manutenzioni`, con filtro per `targa` normalizzata
- portato nel `Dossier Mezzo NEXT` un blocco tecnico read-only con backlog lavori, lavori chiusi e manutenzioni essenziali
- aggiornati i testi dell'area `/next/mezzi-dossier` per riflettere che il dettaglio ora converge `D01` + `D02` minimo
- aggiornati stato migrazione, stato progetto e decision log

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- il `Dossier Mezzo NEXT` non e piu limitato al solo dominio `D01`
- la convergenza tecnica resta minima, leggibile e separata dalla logica legacy di dettaglio lavori/manutenzioni

## Rischio modifica
- ELEVATO

## Moduli impattati
- `Dossier Mezzo`
- `Flotta`

## Contratti dati toccati?
- PARZIALE

## Punto aperto collegato?
- SI

## Legacy o Next?
- NEXT

## Modulo/area NEXT coinvolta
- dossier

## Stato migrazione prima
- IMPORTATO READ-ONLY

## Stato migrazione dopo
- IMPORTATO READ-ONLY

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- SI

## Necessita aggiornamento stato progetto?
- SI

## Rischi / attenzione
- `D02` resta `SENSIBILE` e non va esteso in scrittura senza chiudere relazione con materiali, costi e origini autisti
- il reader tecnico importa solo il sottoinsieme stabile utile al Dossier e non sostituisce i moduli legacy di orchestrazione
- rifornimenti, documenti, costi, PDF e IA contestuale restano fuori dal Dossier in questo step

## Build/Test eseguiti
- `npm run build` -> OK (warning Vite su chunk grandi non bloccante)

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO

---

Regole template:
- niente codice
- niente diff
- linguaggio semplice e sintetico
