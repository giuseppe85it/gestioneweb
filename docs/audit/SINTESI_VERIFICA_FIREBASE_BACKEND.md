# SINTESI VERIFICA FIREBASE / BACKEND

## Cosa e sicuro / non urgente
- Gli endpoint `estrazioneDocumenti`, `analisi_economica_mezzo`, `stamp_pdf`, `ia_cisterna_extract`, `estrazioneSchedaCisterna` e `cisterna_documenti_extract` sono davvero presenti nel repo e hanno caller reali nel client.
- Il progetto Firebase e il bucket usati dal client sono chiaramente identificabili nel repo:
  - progetto `gestionemanutenzione-934ef`
  - bucket `gestionemanutenzione-934ef.firebasestorage.app`
- `estraiPreventivoIA` esiste davvero nel backend repo ed e davvero usata dalla UI `Acquisti`.

## Cosa e da chiarire
- `firestore.rules` non esiste nel repo: la policy dati effettiva non e verificabile da codice versionato.
- `aiCore` e usata dal client ma non compare tra gli export backend del repo.
- Il libretto usa un endpoint Cloud Run esterno (`a.run.app`) mentre nel repo esiste anche una Function `estrazione_libretto`.
- Esistono endpoint OpenAI locali/Vercel (`api/pdf-ai-enhance.ts`, `server.js`) ma il frontend non li richiama in modo dimostrabile.

## Cosa e davvero rischioso sul gestionale attuale
- Toccare Storage senza analisi e il rischio piu concreto:
  - `storage.rules` nel repo blocca tutto;
  - il client usa upload/download/delete/listAll in molti flussi reali;
  - `stamp_pdf` scrive anche lato backend.
- Toccare o rideployare il backend senza mappa reale dei canali IA/PDF puo rompere flussi correnti:
  - `aiCore` non e versionata qui;
  - il canale libretto attivo e fuori repo.
- Irrigidire Firestore/Storage basandosi solo su `auth != null` non basta, perche l'app entra con auth anonima.

## Cosa blocca la progettazione futura
- Assenza di un canale canonico unico IA/PDF.
- Assenza di `firestore.rules` versionate.
- Segreto Gemini salvato in Firestore e leggibile dal client.
- Contratto allegati preventivi ancora multiplo:
  - `preventivi/ia/*`
  - `preventivi/<id>.pdf`

## 5 punti piu importanti
1. `storage.rules` del repo negano tutto, ma il codice usa Storage in molti flussi reali: e il punto piu delicato se si interviene su infrastruttura file.
2. `aiCore` e davvero usata dal client in `europe-west3`, ma non e esportata nel backend versionato qui: esiste un evidente deploy drift / owner drift.
3. Il canale libretto attivo non e la Function del repo ma un Cloud Run hardcoded esterno; quindi il repo non copre tutto il backend realmente usato.
4. `firestore.rules` sono assenti dal repo, mentre Firestore e usato in modo massivo sia via `storage/<key>` sia via collection dedicate.
5. `estraiPreventivoIA` e `stamp_pdf` non sono endpoint teorici: sono flussi reali e vanno considerati in ogni analisi su Storage, PDF e backend.
