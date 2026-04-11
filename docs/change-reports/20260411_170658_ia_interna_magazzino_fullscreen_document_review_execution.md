# Change Report - IA interna Magazzino full screen document review

Data: 2026-04-11  
Tipo: execution runtime NEXT + documentazione  
Rischio: ELEVATO

## Obiettivo
Sostituire la review documentale dispersiva della IA interna `Magazzino` con una schermata operativa full screen dove:
- il documento e protagonista visivo;
- la review IA e ordinata in pannelli gestionali;
- la decisione finale resta esplicita in mano all'utente;
- nessuna esecuzione parte automaticamente dopo l'analisi.

## File runtime toccati
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
1. `NextInternalAiPage.tsx`
- introdotto un modale `full screen` dedicato alla review documento;
- apertura automatica del modale quando una route documentale IA e pronta;
- layout a due colonne:
  - sinistra preview documento grande e leggibile;
  - destra review operativa con campi estratti, righe materiali, match inventario, proposta IA, decisione utente, esecuzione/esito;
- aggiunti tab di navigazione quando sono presenti piu documenti analizzati nello stesso contesto;
- introdotte decision card esplicite per:
  - `Collega a materiale esistente`
  - `Aggiungi costo/documento a materiale esistente`
  - `Crea nuovo articolo`
  - `Carica stock`
  - `DA VERIFICARE`
- la scheda dossier sopra la chat resta, ma viene ridotta a superficie di riepilogo e riapertura review;
- l'azione inline parte solo dopo scelta esplicita utente e solo se il piano resta nel perimetro gia consentito.

2. `internal-ai.css`
- aggiunta la veste full screen del modale review;
- migliorata la gerarchia visiva tra header documento, dati estratti, righe materiali, proposta IA e decisione utente;
- reso leggibile anche su viewport stretti con adattamento responsive.

## Comportamento finale
- Fattura materiali `Magazzino`: review full screen con decisione suggerita verso collegamento materiale/costo senza doppio carico.
- Fattura `AdBlue`: review full screen con decisione suggerita verso `Carica stock`, ma esecuzione solo se il match resta forte e coerente.
- Preventivo: review full screen con fallback operativo verso procurement/ordini, senza esecuzione automatica.
- Caso ambiguo: review full screen con stato `DA VERIFICARE`, nessuna scrittura, motivazione sintetica.

## Vincoli rispettati
- madre legacy non toccata;
- nessun nuovo writer business generale;
- nessuna modifica a `src/pages/*`;
- nessuna esecuzione automatica subito dopo l'analisi;
- nessuna inventiva sui match;
- regole business esistenti preservate.

## Verifiche
- `npx eslint src/next/NextInternalAiPage.tsx` -> OK
- `npm run build` -> OK
- verifica runtime su `/next/ia/interna`:
  - fattura materiali;
  - fattura `AdBlue`;
  - preventivo;
  - caso ambiguo.

## Esito
Patch runtime completata: la UX documentale `Magazzino` non dipende piu dal testo chat come superficie principale di review.  
Restano `DA VERIFICARE` i casi reali piu complessi con OCR debole, righe multiple irregolari e persistenza della decisione utente su dataset live esteso.
