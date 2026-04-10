# Change Report - 2026-04-09 22:28:42

## Titolo
Magazzino NEXT - patch strutturale dominio allargato

## Tipo intervento
- Runtime NEXT
- Dominio read model collegato
- Documentazione di stato

## Obiettivo
Portare `Magazzino NEXT` da modulo operativo locale a centro operativo coerente del dominio magazzino della NEXT, senza toccare la madre legacy, senza riaprire i vecchi entrypoint NEXT come runtime principali e senza introdurre nuovi writer su documenti/costi/procurement.

## File toccati
- `src/next/NextMagazzinoPage.tsx`
- `src/next/next-magazzino.css`
- `src/next/nextStructuralPaths.ts`
- `src/next/domain/nextMaterialiMovimentiDomain.ts`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`
- `CONTEXT_CLAUDE.md`

## Modifiche applicate
- `NextMagazzinoPage.tsx` preserva shape e wrapper reali di `@inventario`, `@materialiconsegnati` e `@cisterne_adblue`, evitando di riscrivere i dataset in forma impoverita.
- Le nuove consegne salvate dal modulo scrivono anche `inventarioRefId`, `materialeLabel`, `direzione`, `tipo`, `origine` e `targa/mezzoTarga` quando il destinatario e un mezzo.
- Il ripristino stock in delete usa prima `inventarioRefId` e poi fallback `descrizione + unita + fornitore`.
- La UI aggiunge una quarta vista `Documenti e costi` in sola lettura con:
  - archivio `@documenti_magazzino`
  - supporto costi/documenti materiali
  - preview ordini/arrivi/preventivi/listino
  - link verso dossier e analisi
- `nextMaterialiMovimentiDomain.ts` inferisce meglio `MEZZO` / `MAGAZZINO` e raggruppa i destinatari mezzo per targa canonica.
- `nextStructuralPaths.ts` accetta `?tab=documenti-costi` e porta i redirect legacy di operativita verso il modulo canonico `/next/magazzino?tab=...`.

## Vincoli rispettati
- Madre legacy non toccata
- Nessuna riapertura dei vecchi moduli NEXT come runtime principali
- Nessun writer nuovo su `@documenti_magazzino`, `@preventivi`, `@listino_prezzi` o `@costiMezzo`
- Nessuna dichiarazione di chiusura finale del dominio

## Verifiche eseguite nel task runtime
- `npx eslint src/next/NextMagazzinoPage.tsx src/next/nextStructuralPaths.ts src/next/domain/nextMaterialiMovimentiDomain.ts` -> `OK`
- `npm run build` -> `OK`
- Runtime verificato in preview locale su:
  - `/next/magazzino`
  - `/next/inventario`
  - `/next/materiali-consegnati`
  - `/next/magazzino?tab=documenti-costi`

## Esito
- Patch runtime completata nel perimetro autorizzato.
- `Magazzino NEXT` risulta piu coerente come centro operativo del dominio, ma il verdetto del modulo resta `PARZIALE`.
- La chiusura finale del dominio e demandata a un audit separato.
