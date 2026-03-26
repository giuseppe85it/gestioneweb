# CHANGE REPORT - D03 autisti canonico read-only per NEXT e IA interna

## Data
- 2026-03-25 23:18

## Tipo task
- patch

## Obiettivo
- chiudere `D03` come dominio autisti canonico read-only per NEXT e IA interna, separando in modo chiaro fonti madre, fallback legacy e flusso locale clone autisti.

## File modificati
- `src/next/domain/nextAutistiDomain.ts`
- `src/next/domain/nextStatoOperativoDomain.ts`
- `src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts`
- `src/next/internal-ai/internalAiChatOrchestrator.ts`
- `src/next/NextInternalAiPage.tsx`
- `src/next/NextCentroControlloPage.tsx`
- `src/next/NextGestioneOperativaPage.tsx`
- `src/next/autisti/NextAutistiCloneLayout.tsx`
- `src/next/autisti/NextAutistiRifornimentoPage.tsx`
- `src/next/autisti/NextAutistiSegnalazioniPage.tsx`
- `src/next/autisti/NextAutistiRichiestaAttrezzaturePage.tsx`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Riassunto modifiche
- creato `nextAutistiDomain` come snapshot read-only D03 che unisce sessioni attive, storico eventi operativi, segnalazioni, controlli, richieste attrezzature, fallback `autisti_eventi` e contesto locale clone;
- normalizzati badge, nome autista, targa/mezzo, timestamp, tipo segnale, provenienza e affidabilita del collegamento;
- la console `/next/ia/interna` instrada ora richieste D03 su segnali autisti, collegamento targa-autista, riepilogo del flusso, anomalie e confine `madre / NEXT / locale`;
- `NextCentroControllo` e `NextGestioneOperativa` mostrano in pagina il confine D03 read-only con conteggi sintetici;
- l'area autisti clone-safe esplicita che i salvataggi restano locali e non sincronizzano la madre.

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- D03 non dipende piu da scorciatoie fragili solo cockpit-centriche;
- la IA legge meglio badge, autista, targa e segnali operativi lato autisti;
- il confine tra madre, clone locale e fallback legacy diventa spiegabile e verificabile.

## Rischio modifica
- ELEVATO

## Moduli impattati
- dominio NEXT `D03 Autisti`
- console `/next/ia/interna`
- `/next/centro-controllo`
- `/next/gestione-operativa`
- area autisti clone-safe

## Contratti dati toccati?
- SI
- introdotto il nuovo read model D03 sopra:
  - `storage/@autisti_sessione_attive`
  - `storage/@storico_eventi_operativi`
  - `storage/@segnalazioni_autisti_tmp`
  - `storage/@controlli_mezzo_autisti`
  - `storage/@richieste_attrezzature_autisti_tmp`
  - `collection/autisti_eventi`
  - stato locale clone autisti namespaced

## Punto aperto collegato?
- SI
- work-package `D03 AUTISTI CANONICO`

## Legacy o Next?
- NEXT

## Modulo/area NEXT coinvolta
- autisti / controllo operativo / IA interna

## Stato migrazione prima
- IMPORTATO READ-ONLY con dominio D03 ancora prudente

## Stato migrazione dopo
- IMPORTATO READ-ONLY con read model D03 canonico dedicato

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- SI

## Necessita aggiornamento stato progetto?
- DA VALUTARE

## Rischi / attenzione
- `autisti_eventi` resta fallback legacy prudente e non va scambiato per fonte forte;
- i salvataggi fatti nelle pagine clone autisti restano locali, quindi i conteggi locali possono divergere dalla madre;
- nel thread IA restano alcuni metadati tecnici di supporto (`Motore`, `Dominio rilevato`, `Affidabilita`), non bloccanti ma non ancora completamente business-first.

## Build/Test eseguiti
- `npm run build` -> OK
- `npx eslint src/next/domain/nextAutistiDomain.ts src/next/domain/nextStatoOperativoDomain.ts src/next/internal-ai/internalAiUnifiedIntelligenceEngine.ts src/next/internal-ai/internalAiChatOrchestrator.ts src/next/internal-ai/internalAiChatOrchestratorBridge.ts src/next/internal-ai/internalAiOutputSelector.ts src/next/NextInternalAiPage.tsx src/next/NextCentroControlloPage.tsx src/next/NextGestioneOperativaPage.tsx` -> OK
- smoke UI reali:
  - `/next/ia/interna` -> `Quali autisti hanno oggi segnali o eventi che richiedono attenzione?` -> 1 segnale aperto rilevato, `PIERO LAURO | targa TI279216 | Controllo KO: GOMME`
  - `/next/ia/interna` -> `Questa targa a quale autista risulta collegata?` con `TI233827` selezionata -> `ELTON SELIMI (badge 38)` con aggancio forte
  - `/next/ia/interna` -> `Fammi un riepilogo read-only del flusso autisti per oggi.` -> `10 sessioni attive`, `35 segnali madre`, `0 locali clone`, `36 agganci forti`, `18 prudenziali`, `105 fallback legacy`
  - `/next/ia/interna` -> `Ci sono anomalie o dati incompleti nel dominio autisti?` -> `24` eventi prudenziali/incompleti e `105` record legacy da tenere separati
  - `/next/ia/interna` -> `Questo dato viene dalla madre, dalla NEXT o da un flusso locale autisti?` -> perimetro chiaro con `431` elementi madre, `0` locali clone e `105` fallback legacy

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO
