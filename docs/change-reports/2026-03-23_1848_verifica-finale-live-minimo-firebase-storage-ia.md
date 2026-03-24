# CHANGE REPORT - Verifica finale live minimo Firebase/Storage IA

## Data
- 2026-03-23 18:48

## Tipo task
- audit
- sicurezza
- documentazione

## Obiettivo
- chiudere in modo definitivo se il primo live minimo read-only della nuova IA interna sia davvero apribile oggi sul solo perimetro `storage/@mezzi_aziendali` + `librettoStoragePath`, senza simulare credenziali o bridge non reali.

## File modificati
- docs/STATO_ATTUALE_PROGETTO.md
- docs/product/CHECKLIST_IA_INTERNA.md
- docs/product/STATO_AVANZAMENTO_IA_INTERNA.md
- docs/product/STATO_MIGRAZIONE_NEXT.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md

## Riassunto modifiche
- Registrato nei documenti di stato che il backend IA supporta gia lato server `GOOGLE_APPLICATION_CREDENTIALS`, `FIREBASE_SERVICE_ACCOUNT_JSON` e `FIREBASE_CONFIG`.
- Distinto in modo esplicito il supporto del canale credenziale dalla presenza reale di credenziali nel processo corrente.
- Fissato il verdetto finale: Firestore `storage/@mezzi_aziendali` e Storage `librettoStoragePath` restano `not_ready`; il fallback ufficiale del `mezzo_dossier` resta il retrieval clone-seeded.

## Impatti attesi
- Nessuna nuova lettura business live viene aperta.
- La readiness della nuova IA interna resta onesta e verificabile.
- Nessuna modifica alla madre, nessuna scrittura business, nessun backend legacy promosso a canale canonico.

## Rischio modifica
- EXTRA ELEVATO

## Rischi / attenzione
- Il supporto credenziale server-side non equivale a una credenziale reale disponibile nel processo.
- `firestore.rules` resta assente dal repo.
- `storage.rules` resta in conflitto con l'uso legacy.
- Manca ancora un access layer Firestore live stretto nel backend IA separato.

## Build/Test eseguiti
- npm --prefix backend/internal-ai run firebase-readiness -> OK
- node -e "import('./backend/internal-ai/server/internal-ai-firebase-admin.js').then(async m=>{const r=await m.probeInternalAiFirebaseAdminRuntime(); console.log(JSON.stringify(r,null,2));})" -> OK
- smoke test non produttivo con FIREBASE_SERVICE_ACCOUNT_JSON fittizio e parseabile -> OK, nessuna lettura business eseguita

## Commit hash
- NON ESEGUITO

## Stato finale
- FATTO
