# CHANGE REPORT - Audit funzioni IA legacy della madre da assorbire nella nuova IA

## Data
- 2026-03-13 20:06

## Tipo task
- documentazione

## Obiettivo
- Mappare le funzioni IA legacy realmente presenti nel repo, distinguere cio che la nuova IA interna deve assorbire da cio che deve solo rifare meglio o lasciare fuori dal perimetro iniziale, senza introdurre nuove feature o riusare runtime legacy.

## File modificati
- docs/architecture/MAPPA_FUNZIONI_IA_LEGACY_DA_ASSORBIRE.md
- docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/STATO_AVANZAMENTO_IA_INTERNA.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md
- docs/change-reports/2026-03-13_2006_docs_audit-funzioni-ia-legacy-da-assorbire.md
- docs/continuity-reports/2026-03-13_2006_continuity_audit-funzioni-ia-legacy.md

## Riassunto modifiche
- Creata una mappa permanente delle capability IA legacy del repo con classificazione per valore business, stato operativo, dipendenze e priorita di assorbimento nella nuova IA interna.
- Aggiornate le linee guida IA per imporre il controllo di questa mappa prima dei futuri task che aprono nuove capability IA nel clone.
- Aggiornate checklist unica, stato avanzamento IA e stato migrazione NEXT per fissare che il nuovo sottosistema non deve fare meno del legacy su `libretto`, `documenti`, `analisi economica` e `preventivi`, ma non puo riusarne a runtime i backend, i writer o i segreti lato client.

## File extra richiesti (se presenti)
- `NESSUNO`

## Impatti attesi
- I futuri task IA partono da una base decisionale gia verificata, invece di riaprire ogni volta l'audit delle funzioni legacy.
- Si riduce il rischio di perdere capability di business reali durante la costruzione della nuova IA interna.
- Si riduce anche il rischio opposto: riusare per errore canali legacy fragili o impropri come backend canonico della nuova IA.

## Rischio modifica
- NORMALE

## Moduli impattati
- documentazione architetturale IA
- governo sottosistema IA interno
- tracciabilita clone/NEXT

## Contratti dati toccati?
- NO

## Punto aperto collegato?
- SI: Governance finale endpoint IA multipli

## Legacy o Next?
- NEXT

## Modulo/area NEXT coinvolta
- ia-interna

## Stato migrazione prima
- IMPORTATO READ-ONLY

## Stato migrazione dopo
- IMPORTATO READ-ONLY

## Aggiornato STATO_MIGRAZIONE_NEXT.md?
- SI

## Necessita aggiornamento stato progetto?
- NO

## Rischi / attenzione
- L'audit distingue capability esistenti nel repo da backend davvero affidabili: non tutto cio che esiste nel codice e un canale canonico o sano da riusare.
- `IAApiKey`, `aiCore`, `server.js`, `api/pdf-ai-enhance.ts` e il Cloud Run libretto restano riferimenti tecnici o criticita, non basi da adottare nella nuova IA.
- I domini verticali come `cisterna` e i workflow approvativi come `stamp_pdf` hanno valore reale ma richiedono perimetro o backend dedicato.

## Build/Test eseguiti
- NON ESEGUITI: task solo documentale

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO

---

Regole template:
- niente codice
- niente diff
- linguaggio semplice e sintetico
