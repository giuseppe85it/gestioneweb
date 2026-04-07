# Change Report - 2026-04-07 09:27

## Prompt
- PROMPT 30
- MODELLO/AGENTE: GPT-5.4 standard
- MODE: OPERAIO
- Rischio: ELEVATO

## Obiettivo
Estendere `src/next/NextDettaglioLavoroPage.tsx` per supportare anche i lavori nati da `controllo mezzo KO`, mantenendo invariato il flusso gia corretto dei lavori nati da `segnalazione`.

## Perimetro effettivo
- `src/next/NextDettaglioLavoroPage.tsx`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `CONTEXT_CLAUDE.md`
- questo report
- continuity report associato

## Dati reali verificati prima della patch
- `@lavori` contiene `6` record, di cui `3` con `source.type = "controllo"` e `3` con `source.type = "segnalazione"`.
- Caso controllo reale usato:
  - lavoro `daade4a2-c681-46d0-99d4-1906d151116d`
  - `source.id = 1667f266-5160-4163-a5a3-14796034b1c6`
  - record controllo origine in `@controlli_mezzo_autisti` con:
    - `note = "1 asse rimorchio gomme lisce "`
    - `check.gomme = false`
    - `linkedLavoroId = "daade4a2-c681-46d0-99d4-1906d151116d"`
- Caso segnalazione reale usato:
  - lavoro `7c6af494-9b02-4bf2-ac67-c994b39436c0`
  - `source.id = 5cdfe350-804f-45c8-879b-433574b0700d`
  - record segnalazione origine con `descrizione = "Freni da controllare"`
- Caso multi-link reale usato:
  - controllo `44ebe449-2750-45e6-add6-4d5c8ef9a8d3`
  - backlink `linkedLavoroIds = ["82df827a-b18b-43fa-b4ee-abf8e3b36389", "f8288347-2b06-4976-9e86-8ea152da1bd2"]`

## Modifica applicata
- introdotto nel dettaglio un resolver origine che distingue in modo esplicito:
  - `source.type = "segnalazione"`
  - `source.type = "controllo"`
- mantenuto invariato il resolver segnalazioni gia esistente.
- aggiunto il ramo controlli:
  - match forte primario su `source.id/originId`;
  - fallback solo sul backlink reale `linkedLavoroId/linkedLavoroIds`;
  - nessun fallback su targa, autore o testo per i controlli.
- generalizzato il blocco UI:
  - da `Problema segnalato`
  - a `Problema / esito origine`
- introdotto il testo reale del controllo:
  - priorita `note`
  - fallback `dettaglio`
  - fallback `messaggio`
  - append dei KO reali letti da `check/koItems`
- introdotto il modale read-only `Apri controllo` con:
  - segnalato da
  - data e ora
  - target
  - mezzo coinvolto
  - esito KO/OK
  - check KO
  - nota / esito reale

## Debug obbligatorio
- Campo reale usato per il testo del controllo KO:
  - `note` come priorita reale verificata sul caso `1667f266-5160-4163-a5a3-14796034b1c6`
  - fallback previsti: `dettaglio`, poi `messaggio`
  - integrazione aggiuntiva dei KO reali da `check/koItems`
- Riferimento forte usato per collegare lavoro e controllo:
  - `lavoro.source.id` / `lavoro.source.originId` == `controllo.id`
  - fallback ammesso solo su `controllo.linkedLavoroId` / `controllo.linkedLavoroIds`
- Perche prima quel caso non veniva mostrato:
  - il dettaglio leggeva solo `@segnalazioni_autisti_tmp`
  - non interrogava `@controlli_mezzo_autisti`
  - quindi `source.type = "controllo"` restava fuori dal resolver e il blocco mostrava `—`

## Verifiche eseguite
- `node_modules\\.bin\\eslint.cmd src\\next\\NextDettaglioLavoroPage.tsx` -> OK
- `npm run build` -> OK
- `npm run lint` -> KO per debito storico globale del repo, non introdotto da questa patch
- Runtime reale su `/next/lavori-in-attesa`:
  - dettaglio modale del lavoro `Segnalazione: freni - Freni da controllare` -> testo reale corretto + `Apri segnalazione`
  - dettaglio modale del lavoro `Controllo KO: GOMME` -> testo reale corretto + `Apri controllo`
- Runtime reale su route diretta:
  - `/next/dettagliolavori/7c6af494-9b02-4bf2-ac67-c994b39436c0?from=lavori-in-attesa` -> `Freni da controllare`
  - `/next/dettagliolavori/daade4a2-c681-46d0-99d4-1906d151116d?from=lavori-in-attesa` -> `1 asse rimorchio gomme lisce` + `Check KO: GOMME`
- Apertura origine corretta:
  - segnalazione -> modale `Segnalazione originale` corretto
  - controllo -> modale `Controllo originale` corretto
- Backlink multi-link reale verificato:
  - `/next/dettagliolavori/82df827a-b18b-43fa-b4ee-abf8e3b36389?from=lavori-in-attesa`
  - `/next/dettagliolavori/f8288347-2b06-4976-9e86-8ea152da1bd2?from=lavori-in-attesa`
  - entrambi aprono il controllo `44ebe449-2750-45e6-add6-4d5c8ef9a8d3`
- Guard rail anti-match fragile verificato con replay locale del resolver:
  - record sintetico `source.type = "controllo"` senza `source.id` e senza backlink reale -> nessuna apertura (`resolved = null`)

## Esito
- Patch completata nel perimetro consentito.
- Nessun file extra richiesto.
