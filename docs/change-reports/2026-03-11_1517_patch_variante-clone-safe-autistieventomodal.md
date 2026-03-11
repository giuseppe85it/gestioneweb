# CHANGE REPORT - Variante clone-safe AutistiEventoModal

## Data
- 2026-03-11 15:17

## Tipo task
- patch

## Obiettivo
- Creare una variante clone-safe di `AutistiEventoModal` per eliminare nel clone le azioni writer ambigue senza alterare il comportamento legacy.

## File modificati
- `src/components/AutistiEventoModal.tsx`
- `src/next/components/NextAutistiEventoModal.tsx`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`

## Riassunto modifiche
- Esteso `AutistiEventoModal` con props opzionali `cloneSafe` e `buildCloneLavoroDetailPath`, lasciando invariato il default legacy.
- In modalita clone-safe sono state neutralizzate `CREA LAVORO` e `IMPORTA IN DOSSIER`.
- La variante clone-safe non apre piu la route legacy `/dettagliolavori?lavoroId=...` e usa, quando disponibile, il dettaglio clone-safe `/next/dettagliolavori/:lavoroId`.
- Creato il wrapper dedicato `src/next/components/NextAutistiEventoModal.tsx`.

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- Riduce l'ambiguita operativa del modal eventi autisti nel clone.
- Prepara il prerequisito tecnico per importare `AutistiInboxHome` senza portare nel clone CTA writer fuorvianti.

## Rischio modifica
- ELEVATO

## Moduli impattati
- `AutistiEventoModal`
- prerequisiti `AutistiInboxHome`
- prerequisiti `Autista 360`

## Contratti dati toccati?
- NO

## Punto aperto collegato?
- SI: Stream eventi autisti canonico definitivo

## Legacy o Next?
- ENTRAMBI

## Modulo/area NEXT coinvolta
- altro

## Stato migrazione prima
- IMPORTATO READ-ONLY

## Stato migrazione dopo
- IMPORTATO READ-ONLY

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- SI

## Necessita aggiornamento stato progetto?
- NO

## Rischi / attenzione
- Il modal clone-safe non e ancora montato in `AutistiInboxHome` o `Autista 360`.
- Le azioni locali PDF/browser restano disponibili e andranno rivalutate solo quando il modal verra innestato nei moduli clone.

## Build/Test eseguiti
- `npm run build` - OK

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO
