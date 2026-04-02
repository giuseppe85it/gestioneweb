# Change Report - 2026-04-01 22:30

## Obiettivo
Applicare in un solo intervento la nuova architettura UI concordata tra Home, `Navigazione rapida` e `Gestione Operativa` nel perimetro NEXT.

## File toccati
- `src/next/NextCentroControlloPage.tsx`
- `src/next/components/QuickNavigationCard.tsx`
- `src/next/NextGestioneOperativaPage.tsx`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Modifiche eseguite
- Home:
  - ordine e mount delle card invariati: `Alert` + `Stato operativo`, poi `Navigazione rapida`, poi `IA interna`;
  - dataset della `Navigazione rapida` riallineato alle sole famiglie fuori da `Gestione Operativa`.
- `QuickNavigationCard`:
  - passaggio da sezioni ricavate implicitamente a sezioni esplicite passate dal chiamante;
  - overlay full-screen invariato come comportamento;
  - sezioni Home ora limitate a `Autisti`, `Dossier / Mezzi`, `IA`, `Anagrafiche`, `Cisterna`, `Area capo / Costi / Analisi`.
- `Gestione Operativa`:
  - pagina ricomposta come hub delle sole 4 famiglie operative approvate;
  - card famiglia introdotte per `Magazzino e materiali`, `Acquisti e ordini`, `Manutenzioni`, `Lavori`;
  - CTA e link secondari puntano solo a route NEXT gia esistenti.

## Vincoli rispettati
- Nessuna modifica fuori `src/next/*` a runtime.
- Nessuna route nuova.
- Nessun cambio a writer, shape dati o logica business.
- Madre intoccata.

## Verifiche
- `npm run build` -> OK
- Restano solo warning preesistenti su `jspdf` e chunk size.
