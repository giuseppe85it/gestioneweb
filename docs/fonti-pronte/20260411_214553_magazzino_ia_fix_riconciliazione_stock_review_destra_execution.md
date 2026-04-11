# Change Report - Magazzino + IA interna fix riconciliazione stock e review destra

Data: 2026-04-11  
Tipo: execution runtime NEXT + documentazione  
Rischio: ELEVATO

## Obiettivo
Correggere due problemi reali e prioritari del dominio `Magazzino` + IA interna, nel solo perimetro autorizzato:
- impedire che il flusso documentale `Consolida stock` aumenti la quantita nei casi di sola riconciliazione/costo su materiale gia consolidato;
- rendere la colonna destra della review documento full screen piu utile, leggibile e meno dominata da dettagli tecnici.

## File runtime toccati
- `src/next/NextMagazzinoPage.tsx`
- `src/next/internal-ai/internalAiMagazzinoControlledActions.ts`
- `src/next/NextInternalAiPage.tsx`
- `src/next/internal-ai/internal-ai.css`

## File documentali toccati
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `CONTEXT_CLAUDE.md`
- mirror corrispondenti in `docs/fonti-pronte/`

## Modifiche runtime
1. Gating corretto della riconciliazione stock
- `NextMagazzinoPage.tsx` non tratta piu come `riconcilia_senza_carico` un documento solo perche trova insieme:
  - match inventario;
  - copertura procurement;
  - match materiale forte.
- la sola riconciliazione viene ora ammessa solo se il `load key` dell'arrivo procurement compatibile risulta gia presente in inventario, quindi se l'arrivo e gia stato consolidato a stock;
- se il procurement compatibile esiste ma non risulta ancora consolidato, il caso non puo piu usare la scorciatoia `Riconcilia documento` / `Aggiungi costo/documento` e resta fuori dal ramo di sola riconciliazione.

2. Allineamento del flusso inline IA interna
- `internalAiMagazzinoControlledActions.ts` usa lo stesso criterio del modulo `Magazzino`;
- il modale/chat della IA non puo piu proporre come sola riconciliazione un caso che in realta richiede ancora un vero carico stock;
- il fix preserva anti-doppio-carico, `stockLoadKeys` e tracciatura sorgente.

3. Review destra piu utile
- `NextInternalAiPage.tsx` e `internal-ai.css` riordinano la colonna destra della review full screen in questo ordine:
  - `Documento`
  - `Righe estratte`
  - `Match inventario`
  - `Decisione`
  - `Azione proposta IA`
  - `Dettagli tecnici`
- le righe estratte sono ora il blocco visivamente piu forte e mostrano:
  - descrizione
  - quantita
  - unita
  - prezzo unitario
  - totale riga
  - codice articolo se presente;
- i dettagli tecnici interni (`stockKey`, `sourceLoadKey`, confidence, presidio, ecc.) stanno in un box collassabile chiuso di default;
- `DA VERIFICARE` resta evidenziato tramite banner/stato e nella sezione decisione.

## Regola business applicata
- Caso tipo `MARIBA`:
  - materiale gia arrivato;
  - materiale gia caricato a stock;
  - match forte con inventario / arrivo procurement / sorgente gia consolidata.
- In questo caso:
  - `Riconcilia documento`
  - `Aggiungi costo/documento a materiale esistente`
  non aumentano la quantita.
- Fanno solo:
  - collegamento documento;
  - riconciliazione;
  - tracciatura sorgente;
  - aggiornamento costo/documento di supporto.
- La quantita aumenta solo se:
  - il materiale non e ancora caricato;
  - oppure l'utente sceglie esplicitamente `Carica stock`.

## Vincoli rispettati
- madre legacy non toccata;
- nessun file `src/pages/*` toccato;
- nessun intervento su `Manutenzioni`;
- nessuna modifica a `cloneWriteBarrier.ts`;
- nessun nuovo writer business aperto.

## Verifiche
- `npx eslint src/next/NextMagazzinoPage.tsx src/next/internal-ai/internalAiMagazzinoControlledActions.ts src/next/NextInternalAiPage.tsx src/next/internal-ai/internal-ai.css` -> OK sul runtime; warning noto solo sul CSS ignorato dalla config ESLint del repo
- `npm run build` -> OK
- runtime verificato su `/next/ia/interna` con:
  - `fattura_mariba_534909.pdf`
  - `fattura_adblue_aprile.pdf`
  - `documento_ambiguo.pdf`
- review destra confermata con gerarchia operativa e righe estratte leggibili
- runtime verificato anche su `/next/magazzino?tab=documenti-costi`:
  - `Righe supporto: 3`
  - `Pronte: 0`
  - `Bloccate: 3`

## Esito
Patch runtime completata nel perimetro autorizzato.  
Il bug di applicazione della riconciliazione e corretto nel codice e il layout della review destra e stato riallineato alla gerarchia operativa richiesta.  
Resta `DA VERIFICARE` la prova browser end-to-end su un candidato live `Pronto`, perche il dataset verificato nel task non ne esponeva nessuno.
