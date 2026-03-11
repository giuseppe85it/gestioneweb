# CHANGE REPORT - Apertura clone-safe Libretti Export read-only

## Data
- 2026-03-11 08:46

## Tipo task
- patch

## Obiettivo
- Aprire nel clone il modulo reale `Libretti (Export PDF)` con il solo perimetro approvato: lista mezzi con libretto, selezione e anteprima PDF locale, senza share, download o azioni esterne.

## File modificati
- src/App.tsx
- src/next/NextIntelligenzaArtificialePage.tsx
- src/next/NextLibrettiExportPage.tsx
- src/next/NextPdfPreviewModal.tsx
- src/next/domain/nextLibrettiExportDomain.ts
- docs/product/REGISTRO_MODIFICHE_CLONE.md
- docs/product/STATO_MIGRAZIONE_NEXT.md

## Riassunto modifiche
- Aggiunta la route clone `/next/libretti-export` sotto il perimetro accesso `ia`.
- Resa cliccabile dal hub `/next/ia` la card reale `Libretti (Export PDF)`.
- Creata una pagina clone dedicata read-only che mostra lista mezzi, selezione e anteprima locale.
- Creato un domain dedicato che legge `@mezzi_aziendali` senza raw read in UI e aggiunge il supporto `librettoStoragePath` per la preview.
- Creato un modal clone locale senza `Condividi`, `Copia link`, `Apri WhatsApp` o `Scarica`.

## File extra richiesti (se presenti)
- NESSUNO

## Impatti attesi
- Il clone IA non e piu solo hub informativo: apre un primo sottomodulo reale ma confinato al read-only.
- La preview PDF usa solo letture e blob locale; nessun writer o runtime IA viene attivato.

## Rischio modifica
- ELEVATO

## Moduli impattati
- NEXT / Intelligenza Artificiale
- NEXT / Libretti Export
- Dominio D01 `@mezzi_aziendali`

## Contratti dati toccati?
- PARZIALE

## Punto aperto collegato?
- SI: Policy Storage effettive

## Legacy o Next?
- NEXT

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
- Il clone apre solo anteprima locale: share, download e aperture esterne restano volutamente assenti.
- Il fallback preview dipende da `librettoStoragePath` e dal comportamento read-only di Storage gia presente nel repo.

## Build/Test eseguiti
- `npm run build` -> OK

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO

---

Regole template:
- niente codice
- niente diff
- linguaggio semplice e sintetico
