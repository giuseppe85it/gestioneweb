# Continuity Report - 2026-04-09 12:14:44

## Stato iniziale verificato
- il form `Nuova / Modifica` di `/next/manutenzioni` esponeva un solo sottotipo `gomme`;
- il salvataggio promuoveva il ramo gomme verso `assiCoinvolti` + `gommePerAsse`;
- il quadro del modulo mostrava solo `Stato gomme per asse`;
- gli eventi straordinari gomme non avevano un canale distinto e restavano confusi con il caso ordinario.

## Stato finale verificato
- il form distingue ora `Gomme ordinarie per asse` e `Gomme straordinarie`;
- il contratto clone-side distingue il tipo intervento gomme con `gommeInterventoTipo`;
- lo straordinario non entra piu nel calcolo di `buildNextGommeStateByAsse(...)`;
- il quadro del modulo separa lo stato ordinario per asse dagli eventi straordinari.

## Blocchi reali
- nessun blocco extra emerso nel perimetro whitelistato;
- nessun file extra richiesto.

## Rischi residui
- i record legacy gomme storici privi di assi non possono essere riclassificati con certezza assoluta;
- il modulo `Manutenzioni` resta `PARZIALE` finche non passa audit separato post-patch.

## Path chiave
- `src/next/NextManutenzioniPage.tsx`
- `src/next/domain/nextManutenzioniDomain.ts`
- `src/next/domain/nextManutenzioniGommeDomain.ts`
- `src/next/next-mappa-storico.css`
