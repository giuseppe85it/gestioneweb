# Continuity Report - Separazione componente Libretto nel ramo reale

## Stato finale
- `src/next/NextInternalAiPage.tsx` monta `src/next/internal-ai/NextEstrazioneLibretto.tsx` solo nel ramo reale del modale review operativo per `Documento mezzo -> Libretto`.
- `src/next/internal-ai/NextEstrazioneLibretto.tsx` contiene la UI separata del caso Libretto.
- `src/next/internal-ai/next-estrazione-libretto.css` contiene lo stile dedicato e isolato del ramo.

## Confini rispettati
- madre intoccata
- nessuna modifica a writer, barrier, router, hook o backend
- nessuna modifica agli altri rami di `/next/ia/interna`
- nessuna modifica a `src/pages/*` o `src/utils/*`

## Verifiche eseguite
- `npx eslint src/next/NextInternalAiPage.tsx src/next/internal-ai/NextEstrazioneLibretto.tsx` -> `OK`
- `npm run build` -> `OK`
- runtime browser su `/next/ia/interna` con iniezione locale di stato documentale:
  - ramo `Documento mezzo -> Libretto` -> componente separato montato `OK`
  - ramo non-libretto (`Preventivo fornitore`) -> modale generico invariato `OK`

## Rischi residui
- restano nel runtime i `403` Storage gia preesistenti e non collegati a questa patch;
- il ramo storico inline `renderLibrettoReviewColumns()` continua a esistere nel file parent ma non viene usato dal modale review operativo reale per il caso verificato.
