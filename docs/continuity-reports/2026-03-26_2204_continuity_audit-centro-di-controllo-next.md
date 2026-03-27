# CONTINUITY REPORT - Audit Centro di Controllo

## Contesto generale
- il progetto resta in fase clone/NEXT read-only della madre
- `Home` e `CentroControllo` sono entrambe superfici chiave del cockpit operativo, ma nel runtime reale non coincidono

## Modulo/area su cui si stava lavorando
- area principale: audit modulo madre `CentroControllo`
- perimetro task recente: ricostruire struttura UI, sorgenti dati, filtri, dipendenze e confronto con la NEXT attuale senza patch runtime

## Stato attuale
- esiste ora un audit dedicato che distingue chiaramente `Home.tsx`, `CentroControllo.tsx`, `/next`, `/next/centro-controllo` e `NextCentroControlloPage.tsx`
- il clone attivo di `/next/centro-controllo` risulta fedele alla pagina madre dedicata, mentre la pagina NEXT domain-driven resta una superficie diversa e non equivalente

## Legacy o Next
- ENTRAMBI

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- clone fedele attivo della pagina madre dedicata `CentroControllo` tramite `NextCentroControlloClonePage`
- clone separato della `Home` madre su `/next`
- layer domain-driven alternativo `NextCentroControlloPage` disponibile ma non usato come route ufficiale del clone

## Prossimo step di migrazione
- se si lavora ancora sul Centro di Controllo, partire dal report audit e decidere esplicitamente se il task riguarda:
  - clone 1:1 della pagina madre dedicata;
  - convergenza futura tra `Home` e `CentroControllo`;
  - uso del domain D10 come supporto interno e non come sostituto del clone

## Moduli impattati
- `CentroControllo`
- `Home`
- route NEXT `/next` e `/next/centro-controllo`

## Contratti dati coinvolti
- `@mezzi_aziendali`
- `@rifornimenti`
- `@rifornimenti_autisti_tmp`
- `@segnalazioni_autisti_tmp`
- `@controlli_mezzo_autisti`
- `@richieste_attrezzature_autisti_tmp`
- `@autisti_sessione_attive`
- `@storico_eventi_operativi`
- `@alerts_state`

## Ultime modifiche eseguite
- creato audit dedicato sul modulo madre `CentroControllo` e sul suo ecosistema collegato
- fissata la distinzione tra clone fedele attivo e pagina NEXT reinterpretata/domain-driven
- aggiornata la tracciabilita documentale clone con entry dedicata

## File coinvolti
- docs/audit/AUDIT_CENTRO_DI_CONTROLLO_MADRE_ECOSISTEMA_NEXT.md
- docs/product/REGISTRO_MODIFICHE_CLONE.md
- docs/change-reports/2026-03-26_2204_docs_audit-centro-di-controllo-madre-next.md
- docs/continuity-reports/2026-03-26_2204_continuity_audit-centro-di-controllo-next.md

## Decisioni gia prese
- il clone fedele della pagina madre dedicata resta oggi la route ufficiale `/next/centro-controllo`
- `Home` e `CentroControllo` non vanno piu trattati come sinonimi runtime senza una decisione esplicita

## Vincoli da non rompere
- non toccare la madre
- non sostituire il clone fedele con la pagina domain-driven senza dichiararlo
- non descrivere come equivalenti `Home`, `CentroControllo` e `NextCentroControlloPage` se il repo non lo dimostra

## Parti da verificare
- decisione finale su convergenza o separazione `Home` / `CentroControllo`
- ruolo futuro del domain D10: supporto interno o superficie UI autonoma

## Rischi aperti
- rischio di clonazione cieca basata sulla documentazione `Home = Centro di Controllo` invece che sul runtime reale
- rischio di perdere blocchi reali del modulo dedicato, in particolare report rifornimenti e feed autisti, se si usa solo la superficie D10

## Punti da verificare collegati
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md` -> standard UI canonico cross-modulo per NEXT
- coerenza documentazione/runtime sul cockpit e sulle superfici globali

## Prossimo passo consigliato
- usare questo audit come base per qualunque task futuro sul cockpit, scegliendo prima se il task e su `Home`, su `CentroControllo` dedicato oppure sulla convergenza tra i due

## Cosa NON fare nel prossimo task
- non sostituire la route `/next/centro-controllo` con `NextCentroControlloPage` chiamandola clone 1:1
- non fondere `Home` e `CentroControllo` per assunzione documentale senza passare da un audit comparato esplicito

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/STRUTTURA_COMPLETA_GESTIONALE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/data/MAPPA_COMPLETA_DATI.md`
- `docs/data/DOMINI_DATI_CANONICI.md`
- `docs/flow-master/MAPPA_MAESTRA_FLUSSI_GESTIONALE.md`
- `docs/audit/AUDIT_CENTRO_DI_CONTROLLO_MADRE_ECOSISTEMA_NEXT.md`
