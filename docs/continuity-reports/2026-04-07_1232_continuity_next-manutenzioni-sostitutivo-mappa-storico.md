# Continuity Report - 2026-04-07 12:32

## Stato iniziale
- `/next/manutenzioni` era un clone read-only.
- Il writer business reale restava nel modulo legacy `src/pages/Manutenzioni.tsx`.
- La nuova vista `Mappa storico` esisteva solo come spec/audit, non come runtime NEXT operativo.

## Stato finale
- `/next/manutenzioni` e ora un modulo NEXT scrivente nel perimetro consentito.
- Il contratto business reale e preservato su:
  - `@manutenzioni`
  - `@inventario`
  - `@materialiconsegnati`
- La nuova vista interna `Mappa storico` e disponibile dentro la stessa route e usa dati reali da:
  - manutenzioni convergenti
  - gomme
  - rifornimenti
  - mezzi
- I dati visuali restano separati dal business e usano solo:
  - `@mezzi_foto_viste`
  - `@mezzi_hotspot_mapping`
  - `mezzi_foto/...`

## Punti da ricordare nei prossimi passaggi
1. Il modulo va mantenuto `PARZIALE` finche non passa audit separato di parity.
2. La deroga clone resta stretta al pathname `/next/manutenzioni` e non va riusata come scorciatoia per altri moduli.
3. `Km ultimo rifornimento` deve continuare a usare solo `nextRifornimentiDomain.ts`.
4. La classificazione `Tipo mezzo` nella mappa deve restare prudente, con fallback `DA VERIFICARE`.
5. I metadati visuali non devono contaminare `@manutenzioni`, `@inventario` o `@materialiconsegnati`.
6. Se si vorra un flusso di sostituzione/eliminazione foto, servira una decisione esplicita aggiuntiva sul boundary Storage.

## Verifiche da riprendere in audit
1. Audit parity completo del nuovo modulo `Manutenzioni`.
2. Verifica separata della semantica legacy di `@materialiconsegnati` dopo uso prolungato del writer NEXT.
3. Verifica del comportamento storico/report PDF su un set piu ampio di casi reali.
