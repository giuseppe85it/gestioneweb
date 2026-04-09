# Continuity Report - 2026-04-09 14:19:58

## Stato iniziale
- Il PDF del `Quadro manutenzioni` usava un export tabellare generico senza immagine del mezzo.
- Anche quando il quadro era di fatto centrato su una sola targa, il PDF non stampava la foto reale del mezzo.
- Nel modulo `Manutenzioni` erano ancora presenti copy fisse ripetitive o esplicative che appesantivano `Dashboard`, `Nuova / Modifica`, `Quadro` e `Dettaglio`.

## Stato finale
- Il PDF del quadro usa ora la foto reale del mezzo per gli export a targa singola, prendendola da `fotoUrl` del preview mezzo associato alla targa.
- Se la foto reale manca, il PDF resta ordinato con fallback neutro e non usa tavole tecniche come sostituto.
- La UI del modulo e piu asciutta:
  - rimossi testi fissi superflui
  - spiegazioni residue spostate su tooltip nativi dei controlli

## File di continuita
- `src/next/NextManutenzioniPage.tsx`: export PDF locale con foto reale, export generale allineato ai risultati visibili, riduzione microcopy e tooltip.
- `src/next/NextMappaStoricoPage.tsx`: dettaglio embedded alleggerito con tooltip sulle tab vista e sull'immagine mostrata.
- `src/next/next-mappa-storico.css`: rimosso stile non piu usato della nota fissa del form.

## Verifiche eseguite
- ESLint mirato: OK
- Build root: OK

## Rischi residui
- Il caricamento della foto nel PDF dipende dalla raggiungibilita reale di `fotoUrl`; se l'URL fallisce o non e piu valido, il PDF usa il fallback neutro.
- Restano warning build preesistenti su chunk size e doppio uso di `jspdf` / `jspdf-autotable`.
- Il modulo `Manutenzioni` resta `PARZIALE` e non puo essere promosso senza audit separato.
