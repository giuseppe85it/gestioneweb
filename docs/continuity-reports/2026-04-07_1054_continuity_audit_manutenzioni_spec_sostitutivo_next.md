# Continuity Report - 2026-04-07 10:54

## Stato iniziale
- Esiste una spec per una nuova vista `mappa/storico` dentro `Manutenzioni` NEXT.
- Il modulo NEXT ufficiale `/next/manutenzioni` e oggi `read-only`.
- Il modulo legacy `/manutenzioni` e invece ancora il writer business reale.

## Stato finale
- Audit completato con mappa verificata di:
  - runtime reali
  - dataset e chiavi effettive
  - writer/reader reali
  - dipendenze collegate
  - mismatch fra spec e repo
- Decisione prodotta:
  - la spec e recuperabile;
  - ma prima della fase implementativa vanno corretti i punti che oggi non coprono la sostituzione reale del modulo.

## Punti da ricordare nella fase implementativa
1. La spec attuale non basta a sostituire il modulo legacy: copre soprattutto la sottovista `mappa/storico`.
2. Per la compatibilita business vanno preservati i writer reali su `@manutenzioni`, `@inventario` e `@materialiconsegnati`.
3. Il `km` da mostrare nella futura mappa va letto da `readNextMezzoRifornimentiSnapshot()`, non da sorting raw di `@rifornimenti`.
4. La classificazione `TipoMezzo` a 5 categorie va resa prudente e verificata sui valori reali di `categoria`.
5. L'import gomme da `AutistiEventoModal` continua a generare voci manutenzione derivate e non va perso.
6. Se si vuole una `Manutenzioni` NEXT davvero scrivente, va deciso anche il boundary `src/utils/cloneWriteBarrier.ts`, oggi aperto solo per `@lavori`.
7. Se si mantiene la nuova route `/next/manutenzioni/mappa/:targa`, servira anche una decisione esplicita sul perimetro di `src/App.tsx`.

## File coinvolti
- `docs/audit/AUDIT_manutenzioni_spec_sostitutivo_next_2026-04-07.md`
- `docs/change-reports/2026-04-07_1054_audit_manutenzioni_spec_sostitutivo_next.md`

## Verifiche da riprendere nella fase successiva
1. Correggere la spec con i punti obbligatori emersi dall'audit.
2. Decidere il boundary di scrittura ufficiale per `Manutenzioni` NEXT, oggi bloccato nel clone.
3. Decidere se la nuova route dedicata e ammessa oppure se la mappa deve vivere dentro `/next/manutenzioni` senza toccare `src/App.tsx`.
4. Verificare live i valori reali di `categoria` in `@mezzi_aziendali` prima di congelare `TipoMezzo`.
5. Definire in modo esplicito se la fase 1 implementa solo la mappa oppure l'intero modulo sostitutivo con writer business reali.
