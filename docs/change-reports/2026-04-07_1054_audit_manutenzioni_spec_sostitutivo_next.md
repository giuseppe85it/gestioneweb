# Change Report - 2026-04-07 10:54

## Task
Audit tecnico dettagliato del modulo `Manutenzioni` attuale e confronto con la spec del nuovo modulo sostitutivo NEXT.

## Perimetro
- sola documentazione di audit/tracciabilita
- nessuna patch runtime
- nessuna modifica alla madre

## Attivita svolte
- verificati runtime reali legacy e NEXT del modulo `Manutenzioni`
- verificate route ufficiali attive e assenza della route spec `/next/manutenzioni/mappa/:targa`
- mappati dataset, reader, writer e side effect business reali su:
  - `@manutenzioni`
  - `@inventario`
  - `@materialiconsegnati`
  - `@mezzi_aziendali`
  - `@rifornimenti`
  - dataset gomme collegati
- verificata la riusabilita reale dei domain NEXT:
  - `nextManutenzioniDomain`
  - `nextManutenzioniGommeDomain`
  - `nextRifornimentiDomain`
  - `nextDossierMezzoDomain`
  - `nextAnagraficheFlottaDomain`
- confrontata la spec presente nel repo `docs/SPEC_MAPPA_STORICO_MANUTENZIONI_NEXT.md` con il codice reale

## Evidenze principali
- `/next/manutenzioni` oggi e un clone `read-only`, non un modulo sostitutivo reale.
- Il modulo legacy scrive davvero su `storage/@manutenzioni`, `storage/@inventario` e `storage/@materialiconsegnati`.
- Esiste un writer secondario su `@manutenzioni` in `AutistiEventoModal` per import gomme autisti.
- Il guard rail `src/utils/cloneWriteBarrier.ts` oggi autorizza nel clone solo `storageSync.setItemSync("@lavori")`: per una `Manutenzioni` NEXT scrivente serve una decisione esplicita anche su questo boundary.
- La spec mappa/storico e utile come sottovista, ma da sola non copre i writer business richiesti per sostituire il modulo legacy.
- La spec va corretta su:
  - perimetro reale del modulo sostitutivo
  - uso del domain rifornimenti
  - classificazione `TipoMezzo`
  - distinzione fra nuovi metadati visivi e contratti business esistenti
  - terminologia Firestore / `storage/@...`

## Esito
- Creato audit tecnico dedicato con decisione finale: `SPEC PRONTA DA CORREGGERE E POI IMPLEMENTARE`.
- Nessun file runtime modificato.
