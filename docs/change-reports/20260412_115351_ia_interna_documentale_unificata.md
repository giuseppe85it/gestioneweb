# CHANGE REPORT - IA INTERNA DOCUMENTALE UNIFICATA

- Data: 2026-04-12
- Obiettivo: trasformare `/next/ia/interna` nell'ingresso unico documentale della NEXT, riusando il motore reale di `Documenti IA` senza duplicare parser, upload, review, apertura originale o salvataggi.

## File runtime toccati
- `src/pages/IA/IADocumenti.tsx`
- `src/next/NextInternalAiPage.tsx`
- `src/next/NextIADocumentiPage.tsx`
- `src/next/internal-ai/internal-ai.css`

## File documentali toccati
- `docs/STATO_ATTUALE_PROGETTO.md`
- `CONTEXT_CLAUDE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/fonti-pronte/STATO_ATTUALE_PROGETTO.md`
- `docs/fonti-pronte/CONTEXT_CLAUDE.md`
- `docs/fonti-pronte/STATO_MIGRAZIONE_NEXT.md`
- `docs/fonti-pronte/REGISTRO_MODIFICHE_CLONE.md`
- `docs/fonti-pronte/CHECKLIST_IA_INTERNA.md`
- `docs/fonti-pronte/STATO_AVANZAMENTO_IA_INTERNA.md`

## Cosa e stato cambiato
- `src/pages/IA/IADocumenti.tsx` espone ora `useIADocumentiEngine()` e i tipi riusabili del motore reale; la pagina legacy continua a usare lo stesso motore, quindi il comportamento business del flusso legacy non viene sostituito.
- `/next/ia/interna` mostra ora una prima vista documentale unificata con:
  - header sintetico e bottone `Apri storico`;
  - colonna `Ingresso unico` con upload, tipo atteso, motore `Documenti IA`, pulsante `Analizza`;
  - tab `Inbox`, `Da verificare`, `Salvati`, `Chat IA`;
  - review documento a 3 colonne;
  - storico filtrabile con `Apri originale`, `Riapri review`, `Vai a`.
- `/next/ia/documenti` resta disponibile ma e stata ridotta a superficie secondaria/storico del motore documentale, con CTA diretta verso `/next/ia/interna`.
- Le destinazioni utente gestite dal clone riusano i route target reali gia presenti:
  - fattura magazzino -> `buildNextMagazzinoPath("inventario")`
  - fattura manutenzione -> `buildNextDossierPath(targa)`
  - preventivo per targa -> `buildNextDossierPath(targa)`
  - ambiguo / non deciso -> review su `/next/ia/documenti`

## Motore documenti riusato
- upload file e preview originale
- analisi documento
- archivio documenti gia salvati
- apertura originale PDF/immagine
- verifica valuta
- salvataggio documento sulle collection reali gia esistenti
- import inventario gia previsto dal motore legacy

## Verifiche eseguite
- `npx eslint src/pages/IA/IADocumenti.tsx src/next/NextInternalAiPage.tsx src/next/NextIADocumentiPage.tsx` -> `OK`
- `npm run build` -> `OK`
- runtime verificato su `http://127.0.0.1:4173/next/ia/interna`
- runtime verificato su `http://127.0.0.1:4173/next/ia/documenti`
- browser verificato:
  - `Apri storico` apre il modal storico reale
  - `Riapri review` riapre una review a 3 colonne da documento salvato
  - `Vai al dossier` porta a `/next/dossier/TI313387` nel caso verificato
  - `Apri originale` apre l'originale in una nuova tab Storage

## Limiti residui
- non e stato forzato alcun nuovo upload live per non alterare dati reali;
- restano `DA VERIFICARE` i rami end-to-end su nuovi file per `Magazzino`, `Manutenzioni`, `Preventivi`, `Da verificare`;
- le destinazioni `Preventivi` e `Manutenzioni` usano entrambe il dossier targa reale perche nel repo non e stata trovata una route dedicata piu granulare per sezione.
