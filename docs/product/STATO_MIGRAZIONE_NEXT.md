# STATO MIGRAZIONE NEXT

## 1. Scopo del documento
Questo documento resta il registro ufficiale dello stato della NEXT, ma dal `2026-03-10` segue una strategia diversa rispetto alla versione precedente.

Serve a:
- capire in pochi minuti quale strategia NEXT e attiva davvero;
- distinguere la NEXT sperimentale sospesa dal nuovo clone `read-only` della madre;
- tracciare l'archiviazione della NEXT attuale e l'avvio del clone fedele;
- segnare quando, in fase successiva, verranno innestati layer puliti, IA e tracking sopra il clone;
- lavorare insieme al registro permanente delle patch clone `docs/product/REGISTRO_MODIFICHE_CLONE.md`.

## 2. Nota di continuita
- La strategia NEXT precedente e sospesa.
- Snapshot archiviate della situazione precedente:
  - `docs/_archive/2026-03-10-next-strategia-pre-clone/MATRICE_ESECUTIVA_NEXT.pre-clone-2026-03-10.md`
  - `docs/_archive/2026-03-10-next-strategia-pre-clone/STATO_MIGRAZIONE_NEXT.pre-clone-2026-03-10.md`
- La madre resta il gestionale operativo principale e non viene toccata.

## 3. Strategia ufficiale attiva
- La NEXT attuale viene considerata esperimento sospeso e da archiviare.
- La nuova priorita e costruire in `src/next/*` un clone fedele `read-only` della madre.
- Il clone deve:
  - usare la stessa UX pratica della madre;
  - leggere gli stessi dati reali;
  - bloccare completamente scritture, delete, upload, import e side effect.
- Layer puliti dedicati, IA e tracking NON sono piu il primo passo: verranno innestati solo dopo che il clone `read-only` sara stabile.

## 4. Stati standard usati in questa fase
- `SOSPESO`: parte o strategia non piu da estendere nel ramo attivo.
- `DA ARCHIVIARE`: parte presente nel repo ma da spostare fuori dal percorso attivo.
- `NON INIZIATO`: il nuovo clone non e ancora stato costruito.
- `IN PREPARAZIONE`: documentazione/regole allineate, ma nessuna patch runtime ancora applicata.
- `IMPORTATO READ-ONLY`: clone o blocco clone gia operativo in sola lettura.

## 5. Tabella sintetica aggiornata

| Elemento | Stato | Note operative | Ultimo aggiornamento |
| --- | --- | --- | --- |
| Strategia NEXT precedente | SOSPESO | Non e piu la base del progetto; non va estesa | 2026-03-10 |
| Snapshot NEXT precedente | IMPORTATO READ-ONLY | Archivio creato in `src/_archive_next_pre_clone/next-2026-03-10-active/` per recuperabilita completa del ramo sperimentale precedente | 2026-03-10 |
| Clone fedele `read-only` della madre | IMPORTATO READ-ONLY | Avviato su `Home`, `Gestione Operativa`, `Mezzi`, `Dossier Mezzo`, `Dossier Gomme`, `Dossier Rifornimenti` e `Analisi Economica`, usando UX madre e azioni bloccate | 2026-03-10 |
| Blocco totale scritture nel clone | IMPORTATO READ-ONLY | Hardening rafforzato su `NextCentroControlloPage`, `NextDossierMezzoPage`, `NextMezziDossierPage` e shell `/next`: bloccati writer, persistenze locali che simulavano workflow, uscite legacy pericolose e azioni IA/upload | 2026-03-10 |
| Lettura dati reali nel clone | IMPORTATO READ-ONLY | Il clone legge gia gli stessi dataset reali della madre nelle aree prioritarie, compresi `@manutenzioni`, `@mezzi_aziendali`, `@rifornimenti`, `@rifornimenti_autisti_tmp`, `@costiMezzo`, `@analisi_economica_mezzi`, `@alerts_state`, `@autisti_sessione_attive`, `@storico_eventi_operativi`, `@segnalazioni_autisti_tmp`, `@controlli_mezzo_autisti` e collezioni documentali IA; dal `2026-03-10` rifornimenti, documenti/costi, manutenzioni/gomme e Centro di Controllo passano pero attraverso layer dedicati read-only che normalizzano merge, dedup, parsing, shape sporche e aggregazioni solo nel dominio | 2026-03-10 |
| Layer puliti dedicati NEXT | IMPORTATO READ-ONLY | Layer clone attivi su `Rifornimenti`, `Documenti + Costi`, `Manutenzioni + Gomme` e `Centro di Controllo / Eventi`: `src/next/domain/nextRifornimentiDomain.ts`, `src/next/domain/nextDocumentiCostiDomain.ts`, `src/next/domain/nextManutenzioniGommeDomain.ts` e `src/next/domain/nextCentroControlloDomain.ts`, collegati a Dossier Rifornimenti, Dossier Gomme, blocco manutenzioni del Dossier Mezzo, Analisi Economica clone e `NextCentroControlloPage`, senza cambiare la UX | 2026-03-10 |
| IA sopra layer puliti | IN PREPARAZIONE | Rinviata a fase successiva, sopra il clone | 2026-03-10 |
| Tracking d'uso NEXT | IN PREPARAZIONE | Rinviato a fase successiva, sopra il clone | 2026-03-10 |

## 6. Regole di aggiornamento per il nuovo corso
Per ogni task futuro che tocca la NEXT bisogna aggiornare questo documento segnando almeno:
1. cosa del clone e stato archiviato, creato o modificato;
2. quali schermate madre sono gia state replicate in `read-only`;
3. come sono state bloccate le scritture;
4. quali letture reali sono gia state mantenute;
5. quali parti restano ancora fuori dal clone;
6. aggiungere anche la voce corrispondente in `docs/product/REGISTRO_MODIFICHE_CLONE.md`.

## 7. Stato documento
- **STATO: CURRENT**
