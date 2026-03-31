# TRACKER NEXT CLONE LOOP

- Ultimo aggiornamento: 2026-03-31 06:52 Europe/Rome
- Regola applicata: tracker conservativo. Nessun modulo non auditato in questo loop viene marcato `CLOSED`.
- Run corrente:
  - controller: selezionato `Mezzi` come primo modulo non `CLOSED` del tracker dopo `Home` e `Centro di Controllo`;
  - builder: riallineata `src/next/NextMezziPage.tsx` alla superficie madre e rimosse dal runtime ufficiale le scritture clone-only; il reader flotta ufficiale diventa read-only safe di default;
  - auditor: audit separato sul codice reale del modulo `Mezzi` con esito `PASS`; prossimo modulo `Dossier Lista`.

| modulo | route | stato iniziale | stato attuale | ultimo run | esito audit | gap aperti | file coinvolti | note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home | `/next` | `FAIL` | `CLOSED` | `2026-03-30 21:46` | `PASS` | nessuno nel perimetro `Home` | `src/next/NextHomePage.tsx`; `src/next/NextCentroControlloPage.tsx`; `src/next/components/NextHomeAutistiEventoModal.tsx`; `src/next/domain/nextCentroControlloDomain.ts` | ciclo `1/2` completato; CTA modal e testi data riallineati alla madre; scritture restano bloccate |
| Centro di Controllo | `/next/centro-controllo` | `NOT_STARTED` | `CLOSED` | `2026-03-30 22:39` | `PASS` | nessuno nel perimetro `Centro di Controllo` | `src/next/NextCentroControlloParityPage.tsx`; `src/next/nextAnagraficheFlottaDomain.ts`; `src/next/domain/nextAutistiDomain.ts`; `src/next/domain/nextRifornimentiDomain.ts` | ciclo `1/2` completato; route ufficiale ripulita da patch/overlay clone-only; prossimo modulo `Mezzi` |
| Mezzi | `/next/mezzi` | `FAIL` | `CLOSED` | `2026-03-31 06:52` | `PASS` | nessuno nel perimetro `Mezzi` | `src/next/NextMezziPage.tsx`; `src/next/nextAnagraficheFlottaDomain.ts`; `src/pages/Mezzi.tsx` | ciclo `2/2` completato; UI madre riallineata; scritture reali e clone-only bloccate; prossimo modulo `Dossier Lista` |
| Dossier Lista | `/next/dossiermezzi` | `NOT_STARTED` | `NOT_STARTED` | `--` | `--` | da verificare nel loop | da mappare nel run del modulo | -- |
| Dossier Mezzo | `/next/dossier/:targa` | `NOT_STARTED` | `NOT_STARTED` | `--` | `--` | da verificare nel loop | da mappare nel run del modulo | -- |
| Dossier Gomme | `/next/dossier/:targa/gomme` | `NOT_STARTED` | `NOT_STARTED` | `--` | `--` | da verificare nel loop | da mappare nel run del modulo | -- |
| Dossier Rifornimenti | `/next/dossier/:targa/rifornimenti` | `NOT_STARTED` | `NOT_STARTED` | `--` | `--` | da verificare nel loop | da mappare nel run del modulo | -- |
| Inventario | `/next/inventario` | `NOT_STARTED` | `NOT_STARTED` | `--` | `--` | da verificare nel loop | da mappare nel run del modulo | -- |
| Materiali consegnati | `/next/materiali-consegnati` | `NOT_STARTED` | `NOT_STARTED` | `--` | `--` | da verificare nel loop | da mappare nel run del modulo | -- |
| Materiali da ordinare | `/next/materiali-da-ordinare` | `NOT_STARTED` | `NOT_STARTED` | `--` | `--` | da verificare nel loop | da mappare nel run del modulo | -- |
| Acquisti / Ordini / Preventivi / Listino | `/next/acquisti`, `/next/ordini-in-attesa`, `/next/ordini-arrivati` | `NOT_STARTED` | `NOT_STARTED` | `--` | `--` | da verificare nel loop | da mappare nel run del modulo | -- |
| Lavori | `/next/lavori-da-eseguire`, `/next/lavori-in-attesa`, `/next/lavori-eseguiti`, `/next/dettagliolavori/:lavoroId` | `NOT_STARTED` | `NOT_STARTED` | `--` | `--` | da verificare nel loop | da mappare nel run del modulo | -- |
| Capo Mezzi | `/next/capo/mezzi` | `NOT_STARTED` | `NOT_STARTED` | `--` | `--` | da verificare nel loop | da mappare nel run del modulo | -- |
| Capo Costi | `/next/capo/costi/:targa` | `NOT_STARTED` | `NOT_STARTED` | `--` | `--` | da verificare nel loop | da mappare nel run del modulo | -- |
| IA Home | `/next/ia` | `NOT_STARTED` | `NOT_STARTED` | `--` | `--` | da verificare nel loop | da mappare nel run del modulo | -- |
| IA API Key | `/next/ia/apikey` | `NOT_STARTED` | `NOT_STARTED` | `--` | `--` | da verificare nel loop | da mappare nel run del modulo | -- |
| IA Libretto | `/next/ia/libretto` | `NOT_STARTED` | `NOT_STARTED` | `--` | `--` | da verificare nel loop | da mappare nel run del modulo | -- |
| IA Documenti | `/next/ia/documenti` | `NOT_STARTED` | `NOT_STARTED` | `--` | `--` | da verificare nel loop | da mappare nel run del modulo | -- |
| IA Copertura Libretti | `/next/ia/copertura-libretti` | `NOT_STARTED` | `NOT_STARTED` | `--` | `--` | da verificare nel loop | da mappare nel run del modulo | -- |
| Libretti Export | `/next/libretti-export` | `NOT_STARTED` | `NOT_STARTED` | `--` | `--` | da verificare nel loop | da mappare nel run del modulo | -- |
| Cisterna | `/next/cisterna` | `NOT_STARTED` | `NOT_STARTED` | `--` | `--` | da verificare nel loop | da mappare nel run del modulo | -- |
| Cisterna IA | `/next/cisterna/ia` | `NOT_STARTED` | `NOT_STARTED` | `--` | `--` | da verificare nel loop | da mappare nel run del modulo | -- |
| Cisterna Schede Test | `/next/cisterna/schede-test` | `NOT_STARTED` | `NOT_STARTED` | `--` | `--` | da verificare nel loop | da mappare nel run del modulo | -- |
| Colleghi | `/next/colleghi` | `NOT_STARTED` | `NOT_STARTED` | `--` | `--` | da verificare nel loop | da mappare nel run del modulo | -- |
| Fornitori | `/next/fornitori` | `NOT_STARTED` | `NOT_STARTED` | `--` | `--` | da verificare nel loop | da mappare nel run del modulo | -- |
| Autisti | `/next/autisti/*` | `NOT_STARTED` | `NOT_STARTED` | `--` | `--` | da verificare nel loop | da mappare nel run del modulo | -- |
| Autisti Inbox / Admin | `/next/autisti-inbox`, `/next/autisti-admin` | `NOT_STARTED` | `NOT_STARTED` | `--` | `--` | da verificare nel loop | da mappare nel run del modulo | -- |
| Manutenzioni | `/next/manutenzioni` | `NOT_STARTED` | `NOT_STARTED` | `--` | `--` | da verificare nel loop | da mappare nel run del modulo | -- |
