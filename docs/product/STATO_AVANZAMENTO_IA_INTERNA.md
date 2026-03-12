# STATO AVANZAMENTO IA INTERNA GESTIONALE

Data audit: 2026-03-11  
Stato generale: IN ANALISI  
Scopo: fotografia tecnica dello stato attuale del repository per progettare in sicurezza il futuro sottosistema IA interno.

## 1. Perimetro analizzato
- Documentazione:
  - `docs/STATO_ATTUALE_PROGETTO.md`
  - `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
  - `docs/product/STORICO_DECISIONI_PROGETTO.md`
  - `docs/architecture/NUOVA_STRUTTURA_GESTIONALE.md`
  - `docs/data/DOMINI_DATI_CANONICI.md`
  - `docs/data/REGOLE_STRUTTURA_DATI.md`
  - `docs/security/SICUREZZA_E_PERMESSI.md`
  - `docs/product/PROTOCOLLO_SICUREZZA_MODIFICHE.md`
  - `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`
  - `docs/audit/VERIFICA_INFRASTRUTTURA_FIREBASE_BACKEND.md`
- Runtime/app:
  - `package.json`
  - `firebase.json`
  - `src/App.tsx`
  - `src/main.tsx`
  - `src/pages/Home.tsx`
  - `src/pages/CentroControllo.tsx`
  - `src/pages/GestioneOperativa.tsx`
  - `src/pages/IA/*`
  - `src/next/*`
  - `src/next/domain/*`
  - `src/utils/storageSync.ts`
  - `src/utils/cloneWriteBarrier.ts`
  - `src/utils/firestoreWriteOps.ts`
  - `src/utils/storageWriteOps.ts`
  - `src/utils/pdfPreview.ts`
  - `src/utils/aiCore.ts`
- Backend:
  - `functions/index.js`
  - `functions/*.js`
  - `functions-schede/*.js`
  - `server.js`
- Controlli aggiuntivi:
  - `git remote -v`
  - ricerche testuali su endpoint IA/PDF, preview, audit log, tracking, upload/delete.

## 2. Fatti verificati nel repo

### 2.1 Frontend e shell
- Il gestionale usa React + Vite.
- Esistono due superfici reali:
  - legacy/madre;
  - clone `/next/*`.
- Il clone ha gia shell, gating e barriere no-write dedicate.

### 2.2 Dati e access layer
- Il gestionale legge e scrive Firestore in modo misto:
  - wrapper `storageSync` su `storage/<key>`;
  - collection dedicate come `@documenti_*`, `@analisi_economica_mezzi`, `@impostazioni_app`.
- Il repo non include `firestore.rules`.
- `storage.rules` nel repo blocca tutto, ma il codice usa upload/download/delete/listAll su molti path reali.
- Il clone dispone di wrapper espliciti per bloccare mutazioni e di readers normalizzati sotto `src/next/domain/*`.

### 2.3 IA e PDF gia presenti
- Esiste una famiglia IA legacy con pagine dedicate:
  - `IAHome`
  - `IAApiKey`
  - `IALibretto`
  - `IADocumenti`
  - `IACoperturaLibretti`
- Esiste una famiglia clone corrispondente read-only sotto `/next/ia/*`.
- Le funzioni/backend IA oggi non hanno un canale unico canonico:
  - callable Firebase (`aiCore`, `estraiPreventivoIA`);
  - HTTP Cloud Functions (`estrazioneDocumenti`, `analisi_economica_mezzo`, `stamp_pdf`, cisterna);
  - Cloud Run esterno per libretto;
  - server Express/OpenAI locale o edge non dimostrato come canale attivo.

### 2.4 Preview, export e artifact
- Il repo ha gia un pattern forte di preview PDF:
  - `PdfPreviewModal`
  - `openPreview`
  - download/share/copia link/WhatsApp
- Non esiste oggi un archivio persistente e ricercabile dedicato agli artifact IA.
- Non esiste nel repo un workflow approva/scarta/rollback per modifiche IA su codice o dati.

### 2.5 Tracking e memoria operativa
- Esiste `src/next/nextUsageTracking.ts`.
- Oggi salva solo in `localStorage`.
- Non risulta collegato al runtime attivo.
- Non esiste oggi una memoria operativa persistente per la IA.

### 2.6 Sicurezza e segreti
- L'app entra con auth anonima.
- La chiave Gemini e letta e scritta dal client su `@impostazioni_app/gemini`.
- Questo rende improprio usare il sistema IA attuale come fondazione del nuovo sottosistema.

### 2.7 Repository remoto
- Il repository ha remote GitHub verificato su `origin`.
- Nel repo non e dimostrata una strategia GitHub App, token service-to-service o branch automation dedicata alla futura IA.

## 3. Decisione raccomandata su dove innestare la IA
- **UI piu sicura**: dentro il clone `/next`, non nella madre.
- **Route/famiglia piu sicura**: una area isolata sotto `/next/ia/*` oppure naming equivalente, distinta dai moduli legacy.
- **Backend piu sicuro**: servizio IA dedicato e separato dalle funzioni IA/PDF gia deployate.
- **Lettura dati piu sicura**:
  - backend IA -> readers controllati -> UI IA;
  - non browser -> writer legacy.
- **Accesso GitHub piu sicuro**:
  - sola lettura in V1;
  - generazione diff/branch isolati solo in fase successiva e sempre con approvazione.

## 4. Motivazione tecnica
- Il clone e gia il perimetro con piu protezioni applicative verificabili.
- La madre ha molti writer diretti e flussi legacy accoppiati; innestare li la nuova IA aumenterebbe il rischio di regressione.
- Le funzioni IA esistenti non sono omogenee ne canoniche, quindi non sono una base affidabile per il nuovo sottosistema.
- La UI e i pattern di preview gia esistono e possono essere riusati senza accendere nuove scritture.
- I layer `src/next/domain/*` sono il precedente piu pulito per leggere dati reali con normalizzazione controllata.

## 5. Rischi principali

| Rischio | Gravita | Stato |
|---|---|---|
| Riutilizzare funzioni IA/PDF legacy come backend canonico | Alta | DA EVITARE |
| Scritture dirette su dataset business senza approval workflow | Alta | DA EVITARE |
| Gestire segreti IA dal client come oggi | Alta | BLOCCANTE |
| Basarsi su policy Firestore effettive non versionate nel repo | Alta/Critica | DA VERIFICARE |
| Basarsi su Storage rules del repo come verita deployata | Critica | DA VERIFICARE |
| Fondere IA Business e IA Audit Tecnico nella stessa runtime | Alta | DA EVITARE |
| Considerare sufficiente il tracking locale `nextUsageTracking.ts` | Media | INSUFFICIENTE |
| Salvare artifact IA nei path Storage business esistenti | Alta | DA EVITARE |

## 6. Blocchi fattibili subito in sicurezza
- Documentazione di governo e checklist.
- Mappa tecnica delle superfici IA riusabili:
  - shell clone;
  - preview modals;
  - readers NEXT;
  - layout/report pattern.
- Definizione dei contratti documentali per:
  - sessioni IA;
  - richieste IA;
  - artifact;
  - audit log;
  - tracking uso.
- Scaffolding architetturale non operativo, separato dal runtime legacy.
- Definizione del primo use case limitato a preview e artifact, senza applicazioni in produzione.

## 7. Blocchi da rimandare
- Qualunque backend IA attivo su produzione.
- Qualunque riuso runtime delle funzioni IA/PDF gia presenti.
- Qualunque scrittura automatica su Firestore/Storage business.
- Qualunque merge automatico su GitHub.
- Qualunque uso di segreti IA dal client.
- Qualunque decisione finale su ruoli/permessi finche non si chiude la matrice sicurezza.

## 8. Dipendenze e mancanze da chiudere
- Policy Firestore effettive.
- Policy Storage effettive.
- Ownership e canale canonico backend IA/PDF.
- Strategia segreti lato server.
- Permission model reale oltre l'auth anonima.
- Contratto di persistenza per artifact, audit log e tracking.
- Strategia GitHub read-only e poi branch/PR.
- Definizione di cosa puo essere letto direttamente e cosa deve passare da snapshot o index.

## 9. Collezioni e moduli suggeriti da validare

### 9.1 Collezioni/strutture
| Nome suggerito | Stato nel repo | Nota |
|---|---|---|
| `ai_sessions` | NON TROVATO | da progettare come contenitore sessioni |
| `ai_requests` | NON TROVATO | da progettare come log richieste |
| `analysis_artifacts` | NON TROVATO | da progettare per report/preview persistenti |
| `analysis_indexes` | NON TROVATO | da progettare per ricerca per targa/autista/periodo/tag |
| `ai_code_changes` | NON TROVATO | da progettare per diff/branch/PR |
| `ai_data_operations` | NON TROVATO | da progettare per future operazioni dati controllate |
| `ui_usage_events` | NON TROVATO | il repo ha solo tracking locale, non persistente |
| `user_operational_profiles` | NON TROVATO | da progettare per memoria operativa |
| `vehicle_analytics_snapshots` | NON TROVATO | da progettare per snapshot spiegabili e versionati |
| `system_alerts` | NON TROVATO | oggi esiste `@alerts_state`, non un modulo IA dedicato |

### 9.2 Moduli logici
| Modulo suggerito | Stato nel repo | Nota |
|---|---|---|
| ai-orchestrator | NON TROVATO | da tenere separato dai backend IA esistenti |
| ai chat handler | NON TROVATO | nessuna chat IA general-purpose operativa dimostrata |
| github integration | NON TROVATO | remote presente, integrazione sicura assente |
| firebase access layer dedicato IA | NON TROVATO | esistono solo readers/writers legacy o clone-safe generici |
| codebase intelligence | NON TROVATO | da progettare |
| retrieval layer | NON TROVATO | da progettare |
| preview validation environment | NON TROVATO | esistono pattern preview PDF, non preview codice/dati IA |
| approval workflow | NON TROVATO | da progettare |
| rollback manager | NON TROVATO | da progettare |
| usage tracking persistente | NON TROVATO | esiste solo tracking locale NEXT |
| analytics & prediction engine | NON TROVATO | da progettare |
| notification gateway | NON TROVATO | predisposizione futura, non verificata |

## 10. Stato per fase

| Fase | Descrizione | Stato |
|---|---|---|
| 0 | ricognizione tecnica del progetto e delle funzioni esistenti | FATTO |
| 1 | fondazione del modulo IA isolato | PRONTO |
| 2 | chat IA interna nel gestionale | BLOCCATO |
| 3 | comprensione codice e dati via sottosistema dedicato | IN ANALISI |
| 4 | primo use case completo in preview | BLOCCATO |
| 5 | preview, approvazione e rollback | BLOCCATO |
| 6 | archivio persistente report e analisi | BLOCCATO |
| 7 | tracking operativo personale | IN ANALISI |
| 8 | analytics economiche e operative | BLOCCATO |
| 9 | alert automatici | BLOCCATO |

## 11. Prossimi passi consigliati
1. Formalizzare il perimetro V1:
   - UI clone;
   - backend IA separato;
   - nessuna scrittura business.
2. Disegnare i contratti dei contenitori IA isolati:
   - sessioni;
   - richieste;
   - artifact;
   - audit log;
   - tracking.
3. Progettare il primo use case completo:
   - report per targa;
   - preview in-app;
   - salvataggio artifact;
   - nessuna applicazione in produzione.
4. Chiudere i blocchi infrastrutturali aperti:
   - policy Firestore;
   - policy Storage;
   - ownership backend IA/PDF;
   - strategia segreti.
5. Solo dopo aprire un task separato di scaffolding tecnico non operativo.

## 12. Cosa non va ancora fatto
- Non implementare chat IA runtime collegata ai backend legacy.
- Non agganciare la nuova IA a `aiCore`, `estrazioneDocumenti`, `analisi_economica_mezzo`, `stamp_pdf`, Cloud Run libretto o `server.js`.
- Non scrivere su dataset business reali.
- Non salvare chiavi provider dal client.
- Non far generare patch dirette al repository senza preview e approvazione.

