# CONTINUITY REPORT - Assorbimento analisi economica IA interna

## Contesto generale
- Il clone NEXT resta `read-only` e la nuova IA interna continua a crescere solo sopra `/next/ia/interna*`, senza backend legacy canonico e senza scritture business.
- Dopo mappatura capability legacy e redesign UI, il sottosistema ha aperto il primo assorbimento operativo di una capability ad alta priorita.

## Modulo/area su cui si stava lavorando
- assorbimento capability legacy alta priorita
- sottosistema IA interna
- home IA e preview economica mezzo

## Stato attuale
- La capability scelta e `Analisi economica mezzo`.
- Esiste ora una preview economica dedicata, distinta dal report mezzo e attivabile dalla home IA con la stessa ricerca targa.
- La preview legge solo documenti/costi diretti gia normalizzati e l'eventuale snapshot legacy salvato in `@analisi_economica_mezzi`.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- chat locale controllata
- report mezzo in anteprima
- memoria locale modulo
- audit materiali/documenti/procurement
- UI ridisegnata del sottosistema IA
- primo assorbimento legacy su analisi economica mezzo in preview-first

## Prossimo step di migrazione
- Valutare con task separato quale capability alta aprire dopo tra `documenti`, `libretto` e `preventivi`, mantenendo lo stesso perimetro sicuro e senza mescolarle.

## Moduli impattati
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/internalAiEconomicAnalysisFacade.ts`
- `src/next/internal-ai/internalAiTypes.ts`
- `src/next/internal-ai/internalAiChatOrchestrator.ts`

## Contratti dati coinvolti
- nessun contratto business nuovo
- lettura clone-safe di:
  - `@costiMezzo`
  - `@documenti_mezzi`
  - `@documenti_magazzino`
  - `@documenti_generici`
  - `@analisi_economica_mezzi`
  - supporto perimetrale su `@preventivi` e `@preventivi_approvazioni`

## Ultime modifiche eseguite
- Scelta documentata di `Analisi economica mezzo` come prima capability legacy da assorbire.
- Creato facade read-only dedicato per preview economica spiegabile.
- Estesa la home IA con preview economica separata e messaggi di perimetro espliciti.
- Aggiornati documenti permanenti del clone e della roadmap IA.

## File coinvolti
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/internalAiEconomicAnalysisFacade.ts`
- `src/next/internal-ai/internalAiTypes.ts`
- `src/next/internal-ai/internalAiChatOrchestrator.ts`
- `docs/architecture/MAPPA_FUNZIONI_IA_LEGACY_DA_ASSORBIRE.md`
- `docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Decisioni gia prese
- Prima capability alta da assorbire: `Analisi economica mezzo`.
- Perimetro del primo step: preview-first, read-only, nessuna rigenerazione IA, nessun backend legacy canonico.
- Procurement e approvazioni restano fuori dalla base economica diretta.

## Vincoli da non rompere
- nessuna scrittura business
- nessun riuso runtime IA legacy come backend canonico
- testi visibili in italiano
- madre intoccabile
- task IA separati e piccoli

## Parti da verificare
- Quanto la preview economica debba incorporare in futuro rifornimenti e manutenzioni come base economica piu ampia.
- Se il prossimo assorbimento debba essere `documenti`, `libretto` o `preventivi` in base al backend disponibile.

## Rischi aperti
- La capability attuale resta deliberatamente parziale: senza backend dedicato non rigenera analisi nuova.
- Se si tenta di assorbire `documenti`, `libretto` o `preventivi` nello stesso task, si rompe il principio di perimetro piccolo e sicuro.

## Punti da verificare collegati
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`

## Prossimo passo consigliato
- Aprire un task separato e mirato per la seconda capability alta da assorbire, con decisione esplicita tra intake documentale, libretto o preventivi.

## Cosa NON fare nel prossimo task
- Non riusare `analisi_economica_mezzo`, `estrazioneDocumenti`, `estraiPreventivoIA`, Cloud Run libretto o `aiCore` come backend canonico del nuovo sottosistema.
- Non fondere piu capability alte nello stesso intervento.

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/architecture/MAPPA_FUNZIONI_IA_LEGACY_DA_ASSORBIRE.md`
- `docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`

---

Regole template:
- niente codice
- niente diff
- testo pronto per copia/incolla in chat
- deve restare chiaro anche dopo giorni o settimane
