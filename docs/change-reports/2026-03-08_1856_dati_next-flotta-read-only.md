# CHANGE REPORT - Primo reader canonico NEXT per Flotta read-only

## Data
- 2026-03-08 18:56

## Tipo task
- dati

## Obiettivo
- verificare il dominio `Anagrafiche flotta e persone` e attivare il primo ingresso dati reale della NEXT con elenco mezzi `read-only` su `/next/mezzi-dossier`

## File modificati
- `src/next/nextAnagraficheFlottaDomain.ts`
- `src/next/NextMezziDossierPage.tsx`
- `src/next/next-shell.css`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STORICO_DECISIONI_PROGETTO.md`

## Riassunto modifiche
- creato un reader canonico NEXT dedicato al dominio `D01`, limitato a `storage/@mezzi_aziendali`
- trasformata `/next/mezzi-dossier` da shell solo UI a elenco mezzi reale `read-only`, con ricerca locale, filtri categoria e badge di sorgente/stato
- mantenuta separazione netta tra dominio logico, dataset fisico, UI NEXT e reader legacy
- aggiornato il registro ufficiale di migrazione NEXT e lo stato progetto con il nuovo livello reale di importazione

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- `Flotta` nella NEXT passa a `IMPORTATO READ-ONLY`
- la legacy resta invariata; nessun writer legacy o backend viene toccato

## Rischio modifica
- NORMALE

## Moduli impattati
- `Flotta`
- `Dossier Mezzo`

## Contratti dati toccati?
- PARZIALE

## Punto aperto collegato?
- NO

## Legacy o Next?
- NEXT

## Modulo/area NEXT coinvolta
- flotta

## Stato migrazione prima
- IMPORTATO SOLO UI

## Stato migrazione dopo
- IMPORTATO READ-ONLY

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- SI

## Necessita aggiornamento stato progetto?
- SI

## Rischi / attenzione
- il reader usa solo i campi stabili dichiarati per questo step: `id`, `targa`, `categoria`, `marca`, `modello`, `autistaNome`
- `@colleghi` resta nel dominio ma non viene letto in questa fase
- il Dossier completo non e ancora importato e non va dedotto da questa lista

## Build/Test eseguiti
- `npm run build` -> OK (warning Vite su chunk > 500 kB gia presente in build output)

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO

---

Regole template:
- niente codice
- niente diff
- linguaggio semplice e sintetico
