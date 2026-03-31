# BACKLOG `Dossier Lista`

- Modulo: `Dossier Lista`
- Route: `/next/dossiermezzi`
- Stato iniziale nel run: `NOT_STARTED`
- Stato finale nel run: `CLOSED`
- Ciclo nel loop: `1/2`
- Esito audit separato: `PASS`

## Gap reali risolti davvero
- `src/next/NextDossierListaPage.tsx` dichiara ora in modo esplicito `readNextAnagraficheFlottaSnapshot({ includeClonePatches: false })`, quindi il runtime ufficiale legge `@mezzi_aziendali` senza overlay clone-only impliciti.
- `src/next/NextDossierListaPage.tsx` riallinea il click lista -> dettaglio al percorso madre-equivalente `/next/dossiermezzi/:targa`, che nel routing ufficiale monta `NextDossierMezzoPage`.
- La pagina NEXT continua a usare lo stesso CSS della madre (`src/pages/DossierLista.css`) e replica la stessa sequenza pratica: categorie -> mezzi filtrati -> ingresso dossier.

## Nessun gap aperto nel perimetro `Dossier Lista`
- Route ufficiale NEXT autonoma senza runtime finale madre.
- UI pratica equivalente alla madre nel perimetro del modulo.
- Nessuna CTA scrivente, nessun modale operativo e nessun PDF da riallineare in questo modulo.
- Lettura degli stessi dati reali della madre tramite layer D01 pulito e senza patch locali.

## File coinvolti
- `src/next/NextDossierListaPage.tsx`
- `src/pages/DossierLista.tsx`
- `src/App.tsx`

## Decisione del loop
- Micro-patch runtime applicata solo dentro `src/next/**`.
- Audit separato eseguito con esito `PASS`.
- Il prossimo modulo del loop e `Dossier Mezzo`.
