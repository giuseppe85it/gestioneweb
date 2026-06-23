# HANDOFF — Dossier Mezzo "Centro di Comando" (2026-06-23)

> ## AGGIORNAMENTO 2026-06-23 (sessione 2) — commit `87169510`
> - **SCAMBIO FATTO:** il "Centro di comando" è ora il **dossier UFFICIALE**. Le route
>   `/next/dossier/:targa` e `/next/dossiermezzi/:targa` aprono `NextDossierMezzoComandoPage`.
>   Il vecchio `NextDossierMezzoPage` è **rimosso dal routing** (import tolto da `App.tsx`); il
>   **file resta nel repo** (recuperabile da git), NON cancellato. Verificato a schermo: lista mezzi,
>   ricerca e scheda mezzo portano tutti al Centro di comando.
> - **PDF RIFATTO:** nuovo `generateDossierComandoPDFBlob` in `src/utils/pdfEngine.ts` (NON tocca il
>   motore del vecchio dossier `buildDossierMezzoPdfDocument`). Grafica nuova (fascia scura + foto,
>   4 KPI colorate, fasce-sezione) + contenuti arricchiti: KPI, Scadenze&allerte, Costi per valuta,
>   Storia del mezzo (timeline), Dati tecnici, Manutenzioni da fare/eseguite, Storico, Gomme,
>   Materiali, Preventivi, Fatture. Verificato a schermo su TI113417 (3 pagine, dati reali).
> - **Punto 1 (collegamenti) VERIFICATO:** tutti i collegamenti funzionano (‹ Mezzi, Analisi economica,
>   Rifornimenti↗Sinottica con filtro targa, Libretto, +Modifica, click manutenzione, Fatture storico→,
>   Elimina fattura, Anteprima PDF documento).
> - **RESTANO APERTI:** punti 4 (armonia/card vuote), 5 (segnalazioni/controlli reali), 6 (consumo
>   identico al Report), 7 (bug date "all'americana" nei moduli materiali/gomme), 9 (Sincronizzare).
> - `npm run build` verde. **DA SINCRONIZZARE** (commit su master, non pushato).
>
> ## AGGIORNAMENTO 2026-06-23 (sessione 3) — commit `a904dc0d` — punti 4-7 FATTI
> - **Consumo medio (pt 6):** ora usa lo STESSO motore del Report (`computeVehicleMedianKmL` in
>   `helpers/refuelAnomalies.ts`: km/L per rifornimento con seed per data + filtro outlier, mediana).
>   Nota: la "Media flotta" del Report è di FLOTTA (non cambia col filtro targa) → non confrontabile
>   col singolo mezzo. (TI113417 = 2.12 km/L, TI298409 = 2.69.)
> - **Segnalazioni/controlli (pt 5):** righe "Segnalazioni aperte" e "Controlli KO aperti" nelle
>   Scadenze & allerte (+ nel PDF), da `readNextMezzoSegnalazioniControlliSnapshot` (lettura separata
>   non bloccante). "Aperto" = regola di chiusura canonica come la Sinottica. Verificato: TI298409 = 2.
> - **Armonia/card vuote (pt 4):** `.dc-detail` `align-items:stretch` + stato-vuoto centrato → Gomme/
>   Preventivi vuoti non lasciano più buchi.
> - **Bug date "all'americana" (pt 7):** FIXATO in `nextMaterialiMovimentiDomain.ts` e
>   `nextManutenzioniGommeDomain.ts` (formato gg/mm/aaaa PROVATO PRIMA di `new Date`). Verificato sui
>   dati reali: 8/8 record ambigui ora corretti (12 05 → maggio, 10 04 → aprile). Impatta in positivo
>   anche le altre viste che usano questi domini (ordinamento/raggruppamento date).
> - **Storia del mezzo senza rifornimenti + PDF 6 mesi (commit `e57b543e`):** la timeline (schermo e
>   PDF) ESCLUDE i rifornimenti (ripetitivi, già nel Report); il PDF mostra solo gli ULTIMI 6 MESI
>   (etichetta "ultimi 6 mesi"). Storico completo → PDF di Manutenzioni. Verificato su TI298409.
> - **RESTANO APERTI:** solo punto 9 (Sincronizzare) e l'eventuale rifinitura di dettaglio non richiesta.
> - `npm run build` verde. Commit su master, non pushato.

> Leggi questo file PER PRIMO per continuare il lavoro sul nuovo dossier mezzo.
> Memorie collegate (Claude Code): `dossier-comando-build`, `chat-ia-stato-verdetto-audit`,
> `timeline-mezzo-e-bug-date-parser`, `mockup-ibrido-inventario-prima`, `workflow-git-master-sync`,
> `verificare-con-npm-run-build`, `utente-non-programmatore`.

---

## 1. Cosa è stato fatto in questa sessione

### a) Rimossa la "chat IA"
- Commit `d032e577`. Frontend `src/next/chat-ia/` eliminato; route `/next/chat` e `/next/chat-tool`
  rimosse; allowance `CHAT_IA_*` tolte da `src/utils/cloneWriteBarrier.ts`; metà "IA Report" tolta da
  `HomeInternalAiLauncher.tsx` (l'**Archivista "Importa documenti" è rimasto intatto**).
- Backend `backend/internal-ai/` **NON toccato** (condiviso con l'Archivista).
- Motivo: la chat inventava (~50%); superflua/doppione. Recuperabile da git.

### b) Nuovo dossier mezzo "Centro di comando" — A FIANCO del vecchio (il vecchio è INTATTO)
- **Pagina nuova:** `src/next/NextDossierMezzoComandoPage.tsx`
- **Route:** `/next/dossier/:targa/comando` (in `src/App.tsx`, dentro `NextRoleGuard areaId="mezzi-dossier"`)
- **Path builder:** `buildNextDossierComandoPath`, `buildNextCentroControlloRifornimentiPath` (in `src/next/nextStructuralPaths.ts`)
- **Accesso/test:** bottone blu **"Centro di comando (nuovo)"** nell'header del dossier attuale
  (`NextDossierMezzoPage.tsx`), oppure URL `…/dossier/<TARGA>/comando` (es. TI113417).
- **Fix collegato:** `src/next/NextCentroControlloParityPage.tsx` ora legge `?targa=` e pre-filtra il
  "Report rifornimenti" (deep-link da `?tab=rifornimenti&targa=…`).
- Commits dossier: `f1a4c6fd` → `e4ccee98`.

### Stato: la **fascia in alto è APPROVATA dall'utente** ("ok va bene così").

---

## 2. Com'è fatto (tecnico, per non rompere niente)

- **Dati:** stesso identico data source del dossier attuale →
  `readNextDossierMezzoCompositeSnapshot` + `buildNextDossierMezzoLegacyView`
  (`src/next/domain/nextDossierMezzoDomain.ts`). Verificato campo-per-campo: **nessun dato perso**.
- **UI:** riproduzione FEDELE del mockup approvato (Claude design, progetto
  `116c34f0-2e69-426f-bdda-8003b3a17f3f`, file "Dossier Mezzo — Centro di Comando v2").
  CSS in un blocco `<style>` interno al componente (costante `COMANDO_CSS`), classi `dc-`/`cmd-`.
  I **modali** (libretto, foto, conferma elimina fattura, liste manutenzioni, timeline, PDF) usano le
  classi `dossier-modal` globali.
- **Fascia comando:** header scuro (foto/targa/modello/categoria/autista + azioni) · 4 KPI ·
  **2 colonne** (sx = Scadenze&Allerte + Costi impilate; dx = Storia del mezzo/timeline).
- **Timeline "Storia del mezzo":** merge di manutenzioni + rifornimenti + materiali + documenti,
  ordinati per data con `timelineTimestamp` (parsing **italiano-first** per evitare il bug "americano").
  In pagina solo **ultimi 10** eventi, **1 riga per evento** (`data · tipo · testo · importo`);
  "Mostra tutto" apre un **modale** con tutto.
- **KPI:** Prossima revisione (giorni) · Costo anno per valuta CHF/EUR (i doc con valuta UNKNOWN non
  sommati → "X senza valuta") · Consumo medio **km/L** (mediana robusta dei km/L tra rifornimenti
  consecutivi) · Manutenzioni da fare.
- **Decisioni UI dell'utente (rispettarle):** Analisi economica = bottone verso la pagina attuale;
  Gomme = dentro il dossier (sezione unica per-asse + straordinari); Libretto = una sola volta (azione
  in alto); Rifornimenti = bottone verso `/next/centro-controllo?tab=rifornimenti&targa=…` (Report in
  Sinottica), e card Foto + card Rifornimenti **tolte** dal dettaglio.

---

## 3. Convenzioni di lavoro (IMPORTANTI)

- **Comunicare SEMPRE in italiano.** L'utente **non è programmatore**: spiegare semplice, mai inventare dati.
- **Git:** commit su `master`, **NON pushare**; l'utente fa "Sincronizza" (Vercel deploya da master).
- **Build:** verificare con `npm run build` (`tsc -b && vite build`) prima di dire "fatto".
- **Verifica VISIVA obbligatoria:** dev server vite su `:5173` (login anonimo automatico), pilotare con
  chrome-devtools MCP, targa reale (es. `TI113417`), confrontare a schermo. **Mai dichiarare "fatto"
  senza aver visto.** Mai lasciare ibridi visivi (sopra nuovo / sotto vecchio) né "schiacciare a sinistra".
- **Fedeltà mockup:** riprodurre identico, non "una versione simile".

---

## 4. DA FARE — prossima chat (in ordine)

1. **Collegamenti alle pagine reali** — verificare a schermo che OGNI azione del nuovo dossier porti
   alla pagina giusta e funzionante: `‹ Mezzi`, `Analisi economica`, `Rifornimenti ↗ Sinottica` (già ok),
   `Libretto` (modale), `Anteprima PDF`, `+ Modifica` (`NextMezzoEditModal`), click su una manutenzione →
   scheda manutenzione (`buildNextManutenzioniPath`), Fatture "storico →" (`NEXT_IA_DOCUMENTI_PATH`),
   "Elimina" fattura (con `runWithCloneWriteScopedAllowance`), apertura PDF di un singolo documento.
2. **PDF del dossier** — `openDossierPdf` usa `generateDossierMezzoPDFBlob` (`src/utils/pdfEngine.ts`),
   lo stesso del dossier vecchio. Verificare che funzioni col nuovo dossier e, se serve,
   **rifarlo/aggiornarlo** ai contenuti e alla grafica del Centro di comando (incluse share/WhatsApp).
3. **Tutto ciò a cui è legato il dossier mezzo** — controllare gli altri punti che lo referenziano
   (lista dossier, link da altre pagine, scheda mezzo, condivisioni, ecc.) e che reggano col nuovo dossier.
4. **Dettaglio completo (armonia)** — rifinire spazi/altezze delle card e le **sezioni vuote**
   (Gomme/Preventivi vuoti lasciano buchi). NON ancora richiesto/fatto.
5. **Scadenze arricchite** — aggiungere **segnalazioni/controlli** reali
   (`readNextMezzoSegnalazioniControlliSnapshot`) e scadenze ricorrenti.
6. **Consumo identico al Report** — agganciare il KPI a `buildRefuelConsumptionIndex`
   (`src/next/helpers/refuelAnomalies.ts`) per mostrare lo STESSO numero del Report rifornimenti
   (ora è una mediana robusta ~vicina ma non identica).
7. **Bug date "all'americana"** — i parser di **materiali** (`nextMaterialiMovimentiDomain.ts:469`) e
   **gomme esterne** (`nextManutenzioniGommeDomain.ts:604`) provano `new Date(raw)` PRIMA del formato
   italiano → date `gg/mm/aaaa` con giorno ≤ 12 lette al contrario (es. 10/05 → 5 ottobre). Verificare
   sui dati reali Firestore e sistemare NEI MODULI (impatta anche le viste attuali, non solo la timeline).
8. **Sostituzione del vecchio dossier** — decidere se/quando "Centro di comando" diventa il dossier
   ufficiale (oggi è a fianco): spostare la route principale e rimuovere il vecchio.
9. **Sincronizzare** i commit (vedi sotto), quando l'utente lo chiede.

---

## 5. Stato git (locale, DA SINCRONIZZARE)

Commit di questa sessione su `master`, sopra `9dacc585`:
`d032e577` (chat rimossa) · `f1a4c6fd` · `9254a1e6` · `07736f03` · `70de8443` · `ab8a5ade` · `1d68d430` · `e4ccee98` (dossier).
Working tree pulito al momento della scrittura di questo handoff.

---

## 6. Frase pronta per la nuova chat

> «Riprendi dall'handoff `docs/_live/HANDOFF_DOSSIER_COMANDO_2026-06-23.md`: continua il nuovo dossier
> "Centro di comando". Parti dal punto 1 (verificare/rifare i collegamenti alle pagine reali) e dal PDF.»
