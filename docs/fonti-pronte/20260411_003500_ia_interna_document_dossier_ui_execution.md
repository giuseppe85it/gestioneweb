# CHANGE REPORT

- Timestamp: 2026-04-11 00:35:00
- Ambito: UI IA interna NEXT, sola presentazione del documento analizzato
- Rischio: NORMALE

## Obiettivo
Rifare l'impaginazione del risultato documento nel modale/chat IA interna in modo che fatture, PDF e allegati risultino leggibili come scheda gestionale, senza toccare motore di classificazione, router, writer business o barrier.

## File toccati
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/internal-ai.css`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `CONTEXT_CLAUDE.md`

## Modifiche eseguite
- sostituita la proposal card documento con una scheda dossier a sezioni:
  - `Testata documento`
  - `Riassunto rapido`
  - `Cosa ha capito la IA`
  - `Dati estratti`
  - `Righe / materiali trovati`
  - `Match e riconciliazione`
  - `Evidenza / testo letto`
  - `Azione finale`
- introdotti helper locali in `NextInternalAiPage.tsx` per comporre una view model UI dai dati gia presenti nel route documentale:
  - `datiEstrattiNormalizzati`
  - `prefillCanonico`
  - `entityRef`
  - `campiDaVerificare`
  - `attachment.textExcerpt`
- rafforzata la gerarchia visiva:
  - titolo documento forte
  - badge separati per stato, azione e confidenza
  - card summary con fallback leggibili
  - box finale azione separato
- aggiornato `internal-ai.css` con layout dossier responsive:
  - griglia 2 colonne desktop
  - stack mobile
  - contenitore alto e scrollabile
  - evidenza testuale secondaria con overflow interno
  - resa distinta per stato positivo e `DA VERIFICARE`

## Vincoli rispettati
- nessuna modifica a motore IA
- nessuna modifica a router IA
- nessuna modifica a writer business
- nessuna modifica a `cloneWriteBarrier`
- nessun file fuori whitelist toccato

## Verifiche eseguite
- `npx eslint src/next/NextInternalAiPage.tsx` -> OK
- `npm run build` -> OK
- runtime verificato su `http://127.0.0.1:4173/next/ia/interna` con allegati dummy:
  - `fattura_mariba_534909.pdf`
  - `fattura_adblue_aprile.pdf`
  - `documento_ambiguo.pdf`
- esito runtime:
  - scheda presente in tutti e tre i casi
  - 7 sezioni visibili e leggibili
  - pannello non collassato (`shellHeight` circa `624px`)
  - CTA e stato prudenziale coerenti con il route gia esistente

## Rischi residui
- la qualita della scheda dipende ancora dalla qualita dei campi estratti gia disponibili nel route documentale
- i documenti poveri di metadata mostreranno fallback come `Non rilevato`, ma in modo ordinato e non ambiguo
- serve audit separato se si vuole valutare la resa su PDF reali eterogenei e con OCR debole
