# Guida convenzioni UI — moduli NEXT (fonte di verità condivisa)

> Scopo: garantire **coerenza tra i moduli** del gestionale. NON è la fotografia di un
> modulo "perfetto" (Manutenzioni è un cantiere): è lo **standard unico** verso cui
> ogni modulo nuovo o rifinito deve tendere. L'agente `custode-coerenza-ui` misura la
> UI **su questa guida**; l'execution la **clona**; entrambi la **aggiornano** quando
> l'owner approva o boccia una scelta.
>
> Ultimo aggiornamento: 2026-07-01. Valori verificati dal codice reale (vedi §Fonti).

## 0. Come si usa e si aggiorna
- Prima di creare/giudicare UI: **leggi questa guida**, poi cita il "fratello da clonare".
- Quando l'owner **approva** una scelta UI → aggiungila/consolidala qui.
- Quando l'owner **boccia** qualcosa → annotala in §7 (anti-pattern) così non si ripete.
- Le divergenze storiche (§6) si allineano **progressivamente**, non tutte insieme: i
  moduli NUOVI/rifiniti nascono già a standard; i vecchi si adeguano quando li tocchiamo.

## 1. Decisioni dell'owner (2026-07-01)
- **Look base = "crema" caldo** (famiglia `man2-*` di Manutenzioni + shell). È lo standard.
- **Una sola finestra (modale)** per tutto il gestionale.
- **Verde unico** per l'azione principale, **rosso unico** per "elimina/distruttivo".

## 2. Preferenze UI dell'owner (regole di gusto, sempre valide)
1. Ogni schermata **dentro la cornice del modulo** (guscio `man2-screen`): mai pezzi "appiccicati" o costruiti come un form fuori contesto.
2. **Compattezza e densità**: informazioni compatte; niente riquadroni/KPI sovradimensionati o spaiati, niente grandi spazi vuoti.
3. **Modali compatti e centrati**; bottoni azione **affiancati ed equilibrati** (Annulla neutro + azione colorata), mai uno gigante a tutta larghezza accanto a uno piccolo.
4. **Testo sempre leggibile** (colore esplicito, mai crema-su-crema).
5. **Zero stili inline "a mano"**: riusa classi/blocchi esistenti; clona il "fratello" che già funziona.
6. **Niente dati tecnici grezzi a schermo** (UUID, id, timestamp ms): solo info utili (targa, data leggibile) o nulla.
7. **Comandi complessi spiegati** con tooltip (`title`) al passaggio del mouse.
8. **Verifica a schermo (screenshot)** prima di dichiarare "fatto" su qualsiasi cosa visiva.

## 3. Token (valori canonici — usare questi, non varianti a caso)
Finché non esiste un file di variabili globali, questi sono i valori di riferimento.
- **Sfondo pagina/shell:** `#f5f1e9`. **Guscio schermata:** gradiente `#f2ece2 → #e8dfd1`.
- **Superfici chiare (input/card interne):** `#fbf8f3`. **Modale:** gradiente `#f4efe6 → #ece5d8`.
- **Verde azione (primario):** `#166534` (hover `#14532d`).
- **Rosso distruttivo:** `#b91c1c` (hover `#991b1b`). ← unico rosso "elimina" (NO `#a32d2d`, `#dc2626`).
- **Testo:** titoli `#151515`; corpo `#1a1a1a`; secondario/caldo `#5f564b`; muted `#64748b`.
- **Bordi:** `rgba(199,189,173,.52)` (cornici), `#e0dccf`/`#ede7d9` (tabelle/divisori).
- **Badge stato:** ok verde tenue, warn ambra, danger rosso, info indaco `#e0e7ff`/`#3730a3`.
- **Raggi:** schermata `26px`, card `16px`, modale `24px`, bottoni `18–20px`, chip `8–999px`.
- **Font:** **una sola famiglia →** `"IBM Plex Sans", "Segoe UI", system-ui`. (NO Inter/Fraunces/monospace per il testo dei moduli.)

## 4. Componenti canonici (il "fratello" da clonare)
Riferimenti: `src/next/next-mappa-storico.css` (sistema `man2-*`) e `src/next/NextManutenzioniPage.tsx`.
- **Guscio schermata:** `<section className="man2-screen">` (CSS `next-mappa-storico.css:1700`). Ogni vista sta qui dentro.
- **Header schermata:** `man2-screen-head` → `man2-screen-title` + `man2-screen-copy` (+ azione a destra). (`:1718/1730/1738`). Occhiello opzionale `man2-eyebrow`.
- **Card/riga lista:** clonare `man2-dafare-item` (card operativa completa, `:4200+`) o la scheda compatta `man2-olio-card` (targa + metriche in testata). NON usare `man2-form-block` per le liste (è roba da form).
- **Tabella:** `man2-pdf-list__table` dentro `man2-pdf-list__table-wrap` (`:2901+`). Le `td` DEVONO avere `color` esplicito (già `#1a1a1a`): il tema di default è chiaro → senza colore il testo è invisibile.
- **Modale (UNICO standard):** backdrop `man2-pdf-modal__overlay` (fixed, centrato) + contenitore `man2-pdf-modal`; per conferme/form brevi aggiungere `man2-pdf-modal--confirm` (max 560px). Titolo `man2-pdf-modal__title`, chiusura `man2-pdf-modal__close`. Footer: **due `man2-btn` affiancati** (Annulla + azione colorata), come `renderPdfDeleteModal`. → Per i modali nuovi NON usare `aix-*`, `scd-backdrop`, `mag-modal`, `cc-*-overlay`.
- **Bottoni:** base `man2-btn` (neutro scuro); primario `man2-btn man2-btn--primary` (verde); distruttivo `man2-btn man2-btn--danger` (rosso). Evitare `man2-btn-full` (100%) accanto a un `man2-btn` piccolo nei footer.
- **Checkbox+testo:** riga `man2-check-label` (spunta a dimensione normale + testo allineato), non stili inline.
- **Badge/pill di stato:** `man2-badge` con variante colore; per stati semantici usare pill ok/warn/danger.
- **Note/aiuto:** `man2-form-copy` (testo leggero) o box `man2-assi-empty` (riquadro d'avviso). NON `<small>` con colore inline.

## 5. Modale: convenzioni obbligatorie
Titolo visibile + chiudi; azioni "Annulla" + conferma affiancate ed equilibrate; `busy` che disabilita durante il salvataggio; chiusura su click del backdrop; testi in italiano; larghezza compatta (`--confirm`) per conferme/form brevi; niente ID/UUID grezzi nel sottotitolo.

## 6. Divergenze storiche da allineare (progressivo, non subito)
Oggi coesistono ~6 "mondi" grafici. Vanno convogliati sullo standard sopra **man mano** che si toccano i moduli:
- **Modali:** `aix-*` (aggancio), `scd-backdrop` (scadenze), `mag-modal` (magazzino), `cc-*-overlay` (centro controllo), `next-shell__modal` → migrare a `man2-pdf-modal`.
- **Rosso distruttivo:** `#a32d2d`/`#dc2626`/`#991b1b` → `#b91c1c`.
- **Grigi testo:** `#5b6474`/`#6b7079`/`#5d5549` → `#5f564b`/`#64748b`.
- **Font:** Inter/Fraunces/monospace nei moduli → IBM Plex Sans.
- **Header** reinventati (`mag-head`, `.scd .pagehead`, `cc-header`) → pattern `man2-screen-head`.
- **Colori hardcoded nei .tsx** (≈27 occorrenze) → spostare in classi/variabili.
- ⚠️ Modali `aix-*` NEXT non importano un CSS proprio e prendono `aix-actions` da `AutistiAdmin.css`: rischio stile mancante fuori contesto — **verificare a schermo** e, migrando a `man2`, il problema sparisce.
> NB: il candidato token-system serio già esistente è `src/next/components/sinottica-flotta-v2-design-tokens.css` (neutrals/brand/stati in variabili): quando si farà una palette globale, generalizzare quello togliendo lo scope `.cc-sinottica-scope-v2`.

## 7. Anti-pattern (bocciati dall'owner — NON rifare)
- Riquadri KPI grandi in griglia da 4 con solo 2 valori (2 colonne vuote). → metriche compatte in testata card.
- Schermata costruita con `man2-form-shell`/`man2-form-block` come se fosse un form. → guscio `man2-screen`.
- Testo/celle senza `color` esplicito su fondo chiaro (crema-su-crema, invisibile).
- Stili inline sparsi su `<table>/<th>/<td>`, `<small style>`, `marginTop` a mano.
- Dichiarare "si vede" avendo controllato solo il DOM/markup, non uno screenshot.

## Fonti (verificato dal codice)
`src/next/next-shell.css`, `src/next/next-mappa-storico.css` (sistema man2, il più completo),
`src/next/next-scadenze.css`, `src/next/next-magazzino.css`, `src/next/next-centro-controllo.css`,
`src/next/components/sinottica-flotta-v2-design-tokens.css`, `src/autistiInbox/AutistiInboxHome.css` +
`AutistiAdmin.css` (definizioni `aix-*`).
