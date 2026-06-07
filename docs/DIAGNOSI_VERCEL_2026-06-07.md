# Diagnosi deploy Vercel — 2026-06-07

> Sessione **sola lettura**: nessuna modifica a config/env/codice. Unica scrittura: questo file.
> Vercel CLI non installata e nessun login → i log nativi di Vercel **non sono stati letti**
> (servono le credenziali di Giuseppe). La diagnosi qui sotto è ottenuta **riproducendo il
> build esattamente come lo vede Vercel**, non leggendo i log Vercel.

## Metodo di riproduzione (perché è attendibile)

Vercel clona dal repo GitHub **solo i file tracciati da git** (i file gitignored/untracked
non arrivano mai sul server di build). Per riprodurre esattamente quella vista ho creato un
`git worktree` staccato (che contiene **solo i file tracciati**, come la clone di Vercel),
ci ho agganciato i `node_modules` locali e lanciato il build. Questo è ciò che succede su Vercel,
indipendentemente dai log.

- Build locale "normale" (cartella di lavoro, con anche i file **non** tracciati presenti su disco): `vite build` verde, `tsc -b` rosso con 7 errori.
- Build su checkout **tracked-only** (= Vercel) a HEAD: **sia `tsc -b` sia `vite build` falliscono.**

La differenza fra le due viste **è** la diagnosi: sul tuo PC ci sono file sorgente che su Vercel non esistono.

---

## 1. CAUSA del fallimento — **PROVATA** (riprodotta), non ipotizzata

Ci sono **due** blocchi indipendenti. Il primo è quello vecchio e fatale; il secondo si è aggiunto a giugno.

### Causa A (root cause, da ~fine aprile) — sorgenti `chat-ia/tools/` esclusi da git

`.gitignore` riga 26 contiene una regola **troppo generica**:

```
tools/
```

Questa regola fa ignorare a git la cartella **`src/next/chat-ia/tools/`**. Verifica:

```
git check-ignore -v src/next/chat-ia/tools
  → .gitignore:26:tools/   src/next/chat-ia/tools
git ls-files src/next/chat-ia/tools/      → 0 file tracciati
ls src/next/chat-ia/tools/                → 6 file .ts + cartella registry/ (presenti SOLO in locale)
```

Quei 6 file (`chatIaToolExecutor.ts`, `chatIaToolTypes.ts`, `chatIaToolRegistry.ts`,
`chatIaToolDates.ts`, `chatIaToolFilters.ts`, `index.ts` + `registry/`) **esistono sul PC di
Giuseppe ma non sono mai stati committati né pushati**. Su GitHub/Vercel non ci sono.

I file che li importano **sì** sono tracciati (`ChatIaPage.tsx`, `ChatIaToolUsePage.tsx`,
`agents/orchestrator.ts`, `agents/types.ts`, `backend/chatIaBackendBridge.ts`) e puntano a
`./tools` / `../tools/...`. Su Vercel quei moduli **non esistono** → il build esplode.

Esito su checkout tracked-only (= Vercel), HEAD:

- **`vite build` fallisce** (exit 1):
  `Could not resolve "./tools" from "src/next/chat-ia/ChatIaPage.tsx"` → *Build failed*
- **`tsc -b` fallisce** (exit 2): 8 × `TS2307 Cannot find module '../tools/...'`

> **Importante: la causa è indipendente dal comando di build.** Non conta sapere se Vercel
> lancia `npm run build` o `vite build`: **falliscono entrambi** perché i sorgenti mancano.
> (vedi nota "altri candidati" sotto: env, Node, case-sensitivity, memoria → tutti **esclusi**.)

Da quando: gli import `../tools/chatIaTool…` compaiono per la prima volta intorno al
**2026-04-28** (commit `d489d751`, poi `a61ce18a` del 06/05). Da lì in poi ogni deploy fallisce.

### Causa B (aggiuntiva, da inizio giugno) — 7 errori TypeScript in Manutenzioni

Anche risolvendo la Causa A, il build resta rosso se Vercel esegue il comando standard
`npm run build` = **`tsc -b && vite build`** (lo script in `package.json`). `tsc -b` fallisce per:

```
src/next/domain/nextManutenzioniDomain.ts(1099,5)  TS2322  string|null non assegnabile a string|undefined
src/next/NextManutenzioniPage.tsx(274)             TS6133  'normalizeDateEditorValue' dichiarata e mai usata
src/next/NextManutenzioniPage.tsx(397)             TS6133  'isManutenzioneCompletabile' dichiarata e mai usata
src/next/NextManutenzioniPage.tsx(2099)            TS6133  'handleOpenOrigineRecord' dichiarata e mai usata
src/next/NextManutenzioniPage.tsx(2126,42)         TS2345  string|null|undefined non assegnabile a string
src/next/NextManutenzioniPage.tsx(3208,30/69)      TS2345  string|null non assegnabile a string
```

`tsconfig.app.json` ha `strict`, `noUnusedLocals`, `noUnusedParameters` → anche una funzione
inutilizzata blocca il build. Questi errori sono entrati nel batch 05–06/06
(commit `71927c34`, `18099732`, `56b61b09`). `vite build` da solo **non** li vede (non type-checka),
ma `npm run build` li incontra prima di arrivare a vite.

> Riepilogo: **Causa A** uccide sia `vite build` sia `tsc -b` da fine aprile. **Causa B** uccide
> in più `tsc -b` da inizio giugno. Per avere un deploy verde vanno sistemate **entrambe**.

### Altri candidati — VERIFICATI ed ESCLUSI come causa del fallimento

- **Variabili d'ambiente**: l'unica env custom usata dal frontend è `VITE_INTERNAL_AI_BACKEND_URL`
  (client chat-IA / internal-ai). `import.meta.env.DEV` è built-in di Vite. **Nessun `process.env.*`
  nel frontend.** Vite **non** fa fallire il build se una `VITE_*` manca (diventa `undefined`) →
  **non è causa di build failure** (è però un problema *a runtime*, vedi punto 4).
- **Versione Node**: in locale `node v20.20.0`, `vite build` verde → Node non c'entra col fallimento
  attuale. Non c'è però `engines`/`.nvmrc`/`packageManager` → Node su Vercel non è pinnato (rischio
  futuro, non causa presente).
- **Case-sensitivity (Linux vs Windows)**: gli errori non sono mismatch di maiuscole negli import;
  il problema `tools/` è una cartella **genuinamente assente**, non un case sbagliato. Escluso.
- **Memoria/chunk size**: produce *warning*, non *errori*. Escluso.

---

## 2. DA QUANDO la produzione è ferma, e cosa manca agli autisti

**Ferma da ~fine aprile 2026** (~28/04, primo push con gli import `../tools` rotti). Sono **~6 settimane**.
L'ultima produzione funzionante = ultimo push **prima** del ~28/04. Conferma esatta della data:
dalla dashboard Vercel (Deployments → ultimo deploy "Ready") o via `vercel login` + `vercel ls`.

Nota: il push grosso di ieri (`384cf21f` → `79d0f31c`, ~205 oggetti) **ha** ritriggerato un deploy,
ma quel deploy è fallito come tutti gli altri — non ha cambiato nulla in produzione.

**Sì, agli autisti manca molto.** La superficie inbox autisti / segnalazioni è cambiata in modo
sostanziale durante il freeze (diff `d489d751..HEAD`, solo file autisti/segnalazioni, esclusi i test):

```
src/next/autistiInbox/NextAutistiAdminNative.tsx        +694/-...
src/next/components/NextHomeAutistiEventoModal.tsx       +537/-...
src/next/components/NextImportGommeChiusuraModal.tsx     +403  (nuovo)
src/next/domain/nextAutistiDomain.ts                     +160/-...
src/next/.../rows/ArchivioRowSegnalazione.tsx            +231  (nuovo)
src/next/writers/gruppoSegnalazioniWriter.ts             +240  (nuovo)
src/next/...agganciaSegnalazioneAManutenzioneEsistenteWriter.ts  +433
src/next/nextSegnalazioniWriter.ts                       +70
src/next/autistiInbox/NextAutistiInboxHomeNative.tsx     +35/-...
... (e altri)
```

In pratica gli autisti usano un'app di ~6 settimane fa: tutte le modifiche a inbox segnalazioni,
eventi gomme, raggruppamento/sgancio segnalazioni e aggancio a manutenzione **non sono live**.

---

## 3. COSA SERVE per il fix (una riga per scenario — NON applicato in questa sessione)

- **Causa A (obbligatorio):** correggere `.gitignore` riga 26 (`tools/` è troppo generica e cattura
  `src/next/chat-ia/tools/`) e **committare/pushare `src/next/chat-ia/tools/**`** così Vercel ha i file.
  (Controllato: `src/next/chat-ia/tools/` è **l'unica** cartella sorgente ignorata sotto `src`.)
- **Causa B (obbligatorio):** sistemare i 7 errori TS in `NextManutenzioniPage.tsx` e
  `nextManutenzioniDomain.ts` (rimuovere i simboli inutilizzati; gestire `null`/`undefined`) così
  `tsc -b` passa.
- **Verifica/igiene (consigliato):** pinnare Node con `engines` o `.nvmrc` (locale `v20.20.0`;
  Vite 7 richiede `^20.19 || >=22.12`) per evitare sorprese future sul Node di Vercel — non è la causa attuale.
- **Per leggere i log nativi di Vercel:** Giuseppe esegue `vercel login` poi
  `vercel ls` + `vercel inspect --logs <deploy-url>`, oppure dashboard Vercel → Deployments → build fallito.

---

## 4. RISCHI di un deploy riuscito ORA

- **Salto di ~6 settimane in un colpo solo:** appena il build passa, **tutti** gli utenti (autisti
  inclusi) ricevono l'app nuova simultaneamente — è una SPA, deploy atomico. L'header
  `Cache-Control: no-store` (in `vercel.json`) fa sì che i browser non cachino l'HTML → passaggio
  rapido al bundle nuovo, **finestra di coesistenza vecchio/nuovo client minima**.
- **Compatibilità dati (DA VERIFICARE prima del deploy):** durante il freeze l'app *vecchia* in
  produzione ha scritto segnalazioni nel formato vecchio. Il codice nuovo ha **writer cambiati/nuovi**
  (`nextSegnalazioniWriter.ts`, `writers/gruppoSegnalazioniWriter.ts`,
  `agganciaSegnalazioneAManutenzioneEsistenteWriter.ts`) e un writer **rimosso**
  (`presaInCaricoSegnalazioneWriter.ts`, commit `5e245686`). I **reader** nuovi devono saper leggere
  i dati prodotti dall'app vecchia in queste 6 settimane. **Questo non è stato verificato in questa
  sessione** (richiede lettura riga-per-riga di reader/writer) → consiglio una review mirata di
  compatibilità dati prima di mettere live.
- **Runtime chat-IA / internal-ai:** se `VITE_INTERNAL_AI_BACKEND_URL` non è impostata su Vercel,
  le feature internal-ai/chat-IA puntano a `undefined` (build OK, funzione morta a runtime). Il
  backend `internal-ai` (porta 4310) **non** è una function Vercel (nessuna `/api`, nessuna config
  `functions` in `vercel.json`): è un servizio esterno separato e deve essere raggiungibile a parte.

---

### Comandi di verifica usati (tutti read-only)

```
git worktree add --detach <tmp> HEAD        # checkout tracked-only = vista Vercel
(cd <tmp> && npx tsc -b --force)            # exit 2: 8×TS2307 tools + 7 errori manutenzioni
(cd <tmp> && npx vite build)                # exit 1: Could not resolve "./tools"
git check-ignore -v src/next/chat-ia/tools  # .gitignore:26 tools/
git ls-files src/next/chat-ia/tools/        # 0 (non tracciato)
```
Worktree temporanei e junction `node_modules` rimossi a fine sessione; repo principale pulito.
