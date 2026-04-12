# Change Report - Audit runtime E2E fix Magazzino + IA interna

Data: 2026-04-11  
Tipo: audit runtime/documentazione  
Rischio: EXTRA ELEVATO

## Obiettivo
Verificare nel runtime reale se il fix appena applicato al dominio `Magazzino` + IA interna consente davvero:
- `Riconcilia documento` senza incremento quantita;
- `Aggiungi costo/documento` senza incremento quantita;
- `Carica stock` con incremento quantita solo nei casi corretti;
senza inventare dati, senza forzare scritture e senza allargare il perimetro writer.

## File toccati
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `CONTEXT_CLAUDE.md`
- mirror corrispondenti in `docs/fonti-pronte/`

## Runtime verificato
1. Route e processi
- preview locale avviata su `http://127.0.0.1:4173`
- backend IA separato avviato su `http://127.0.0.1:4310`
- route verificate:
  - `/next/magazzino?tab=documenti-costi`
  - `/next/ia/interna`

2. Evidenza live su `/next/magazzino?tab=documenti-costi`
- pannello `Carichi stock da arrivi procurement`:
  - `Pronte: 9`
  - `Bloccate: 1`
  - caso reale osservato: `FASCIA SIC STORZ INOX RINFORZATA ... MARIBA ...` marcato come gia consolidato in inventario
- pannello documentale `Righe supporto`:
  - `Righe supporto: 3`
  - `Pronte: 0`
  - `Bloccate: 3`
  - candidati reali osservati:
    - `OLIO EXXON PER COMPRESSORE`
    - `CARTUCCIA PER PSD100029 FT036-FT037 PRIMARIA`
    - `SPESE DI TRASPORTO E IMBALLI`

3. Evidenza live su `/next/ia/interna`
- review destra verificata su:
  - `fattura_mariba_534909.pdf`
  - `fattura_adblue_aprile.pdf`
  - `documento_ambiguo.pdf`
- gerarchia confermata:
  - `Documento`
  - `Righe estratte`
  - `Match inventario`
  - `Decisione`
  - `Azione proposta IA`
  - `Dettagli tecnici`
- `Dettagli tecnici` verificato come collassato di default
- nel live persistito corrente:
  - `fattura_mariba_534909.pdf` mostra header `Riconciliazione proposta` ma nel blocco decisionale resta `Scelta attuale: DA VERIFICARE`
  - `fattura_adblue_aprile.pdf` mostra header `Pronto con conferma` ma nel blocco decisionale resta `Scelta attuale: DA VERIFICARE`
  - nessun bottone `Conferma` e risultato disponibile in questo stato runtime

## Esito dell'audit
- non esiste oggi un candidato documentale live `Pronto` su cui eseguire in sicurezza una prova scrivente reale del fix;
- nessuna scrittura business reale e stata quindi eseguita;
- nessuna quantita prima/dopo e misurabile nel browser sui rami documentali richiesti;
- nessun micro-fix runtime e stato applicato, perche il blocco reale e il dataset live, non una riproduzione del bug in un caso eseguibile.

## Controlli richiesti dal task
1. `Riconcilia documento` NON incrementa
- Esito: `DA VERIFICARE` end-to-end nel runtime live, per assenza di candidato documentale `Pronto`.

2. `Aggiungi costo/documento` NON incrementa
- Esito: `DA VERIFICARE` end-to-end nel runtime live, per assenza di candidato documentale `Pronto`.

3. `Carica stock` incrementa solo quando corretto
- Esito: `DA VERIFICARE` sul ramo documentale live; il pannello procurement mostra casi pronti, ma il task richiedeva il ramo documentale e non espone oggi candidati eseguibili.

4. Gerarchia review destra
- Esito: `OK`, verificata nel runtime reale.

5. Righe estratte come blocco dominante
- Esito: `OK`, verificato nel runtime reale.

## Verifiche tecniche rieseguite
- `npx eslint src/next/NextMagazzinoPage.tsx src/next/internal-ai/internalAiMagazzinoControlledActions.ts src/next/NextInternalAiPage.tsx src/next/internal-ai/internal-ai.css` -> `OK` sul runtime; warning noto solo sul CSS ignorato dalla config ESLint del repo
- `npm run build` -> `OK`

## Vincoli rispettati
- nessuna modifica alla madre legacy;
- nessun intervento su `Manutenzioni`;
- nessun writer nuovo;
- nessuna scrittura live forzata;
- nessun dato fake introdotto nel dataset.

## Esito finale
Audit runtime completato.  
Il fix resta valido nel codice e la review destra e confermata nel runtime reale, ma il dataset live non offre ancora un caso documentale `Pronto` che permetta la prova browser end-to-end di quantita invariata o incrementata nei rami richiesti.  
La capability resta `PARZIALE` e la prova live resta `DA VERIFICARE`.
