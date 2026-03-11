# CHANGE REPORT - Route clone dedicata Analisi Economica

## Data
- 2026-03-11 10:44

## Tipo task
- patch

## Obiettivo
- Aprire `Analisi Economica` nel clone come route reale dedicata `/next/analisi-economica/:targa`, riusando la pagina clone gia esistente e mantenendo invariato il perimetro read-only.

## File modificati
- `src/App.tsx`
- `src/next/NextDossierMezzoPage.tsx`
- `src/next/nextData.ts`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`

## Riassunto modifiche
- Aggiunta la route clone `/next/analisi-economica/:targa` collegata a `NextAnalisiEconomicaPage`.
- Aggiornato il dossier clone per aprire `Analisi Economica` sulla route dedicata.
- Convertito il vecchio `?view=analisi` del dossier in redirect tecnico verso la nuova route, evitando doppio rendering divergente.
- Riallineata la metadata `mezzi-dossier` per non dichiarare piu `Analisi Economica` come sola sottovista interna.

## File extra richiesti (se presenti)
- NESSUNO

## Impatti attesi
- Migliora la parita routing del clone rispetto alla madre sulla famiglia Dossier / Analisi Economica.
- Non cambia il dominio dati e non riattiva rigenerazione IA, writer o endpoint esterni.

## Rischio modifica
- NORMALE

## Moduli impattati
- Dossier Mezzo clone
- Analisi Economica clone
- Metadata clone `Mezzi / Dossier`

## Contratti dati toccati?
- NO

## Punto aperto collegato?
- SI: Governance endpoint IA/PDF multipli

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
- NO

## Rischi / attenzione
- `NextAnalisiEconomicaPage` mantiene ancora le azioni locali PDF/share/WhatsApp gia presenti; non sono state ristrette in questa patch.
- `Gomme` e `Rifornimenti` restano ancora sottoviste interne del dossier, quindi la parita routing del blocco mezzo non e completa.

## Build/Test eseguiti
- `npm run build` -> OK

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO
