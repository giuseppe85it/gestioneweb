# CHANGE REPORT - Fase 2 mirata barriera no-write Cisterna

## Data
- 2026-03-11 13:35

## Tipo task
- patch

## Obiettivo
- Estendere la barriera no-write del clone ai writer Firebase/Storage diretti che bloccavano la futura migrazione di `Cisterna IA` e `Schede Test`, senza avviare ancora la migrazione dei moduli e senza rifattorizzare tutto il repo.

## File modificati
- `src/utils/firestoreWriteOps.ts`
- `src/utils/storageWriteOps.ts`
- `src/pages/CisternaCaravate/CisternaCaravateIA.tsx`
- `src/pages/CisternaCaravate/CisternaSchedeTest.tsx`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`

## Riassunto modifiche
- Creati wrapper sottili riusabili per mutator Firestore (`addDoc`, `updateDoc`, `setDoc`, `deleteDoc`) e Storage (`uploadBytes`, `uploadString`, `deleteObject`), agganciati alla `cloneWriteBarrier`.
- Sostituiti nei due moduli Cisterna i writer diretti scoperti principali con i nuovi wrapper.
- Mantenuto invariato il runtime madre fuori da `/next`, con pass-through completo quando il clone non e attivo.

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- Se i due moduli writer Cisterna verranno portati nel clone, i loro upload/salvataggi principali saranno gia fermati dalla barriera anche senza dipendere solo da helper o `fetch`.
- Nessun impatto sui reader e nessun cambio del comportamento business della madre.

## Rischio modifica
- ELEVATO

## Moduli impattati
- barriera clone
- Cisterna IA
- Cisterna Schede Test

## Contratti dati toccati?
- NO

## Punto aperto collegato?
- SI: policy Firestore/Storage e governance endpoint IA/PDF in `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`

## Legacy o Next?
- ENTRAMBI

## Modulo/area NEXT coinvolta
- sistema

## Stato migrazione prima
- IMPORTATO READ-ONLY

## Stato migrazione dopo
- IMPORTATO READ-ONLY

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- SI

## Necessita aggiornamento stato progetto?
- NO

## Rischi / attenzione
- Restano ancora fuori i mutator SDK diretti nel resto del repo.
- `Cisterna Schede Test` resta comunque non pronto a essere migrato nel clone senza un task dedicato di integrazione.

## Build/Test eseguiti
- `npm run build` -> OK

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO
