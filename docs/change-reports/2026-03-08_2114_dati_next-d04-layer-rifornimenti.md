# CHANGE REPORT - Layer NEXT D04 rifornimenti canonico ridotto

## Data
- 2026-03-08 21:14

## Tipo task
- dati

## Obiettivo
- costruire il primo layer di normalizzazione NEXT per `D04 Rifornimenti e consumi` e usarlo nel `Dossier Mezzo NEXT` senza toccare la legacy

## File modificati
- src/next/nextRifornimentiConsumiDomain.ts
- src/next/NextDossierMezzoPage.tsx
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/STATO_ATTUALE_PROGETTO.md
- docs/product/STORICO_DECISIONI_PROGETTO.md

## Riassunto modifiche
- creato un reader/layer NEXT dedicato a `D04` che legge solo `storage/@rifornimenti.items`
- integrato nel `Dossier Mezzo NEXT` un blocco rifornimenti `read-only` basato solo sul modello pulito prodotto dal layer
- aggiornati stato migrazione NEXT, stato progetto e storico decisioni per registrare l'ingresso `D04` a `canonico ridotto`

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- il Dossier Mezzo NEXT legge ora un primo blocco rifornimenti reale senza usare `tmp` o merge legacy
- il gestionale madre e l'app autisti restano invariati; la normalizzazione vive solo nel perimetro NEXT

## Rischio modifica
- ELEVATO

## Moduli impattati
- src/next/NextDossierMezzoPage.tsx
- src/next/nextRifornimentiConsumiDomain.ts

## Contratti dati toccati?
- PARZIALE

## Punto aperto collegato?
- NO

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
- `km` e `costo` restano campi opzionali/non garantiti nel blocco `D04`
- il layer accetta solo `@rifornimenti.items`; nessun fallback su `value.items` o `tmp`

## Build/Test eseguiti
- `npm run build` -> OK
- warning non bloccante Vite sui chunk grandi

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO

---

Regole template:
- niente codice
- niente diff
- linguaggio semplice e sintetico
