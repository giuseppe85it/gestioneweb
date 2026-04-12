# CONTINUITY REPORT - AUDIT IA INTERNA STATO REALE

## Perche esiste questo report
- Questo task non corregge nulla nel runtime.
- Serve a lasciare una fotografia leggibile e riapribile della IA interna/documentale com'e oggi davvero.

## Punto di continuita
- Report principale: `docs/audit/AUDIT_IA_INTERNA_STATO_REALE_2026-04-12.md`

## Fatti chiave da portare nel prossimo task
- L'ingresso utente reale e `/next/ia/interna`.
- La Home `/next` oggi fa solo da launcher verso quella route.
- `/next/ia/documenti` oggi e soprattutto storico secondario del motore documentale.
- Il motore reale del flusso documentale non e nuovo: e `useIADocumentiEngine()` in `src/pages/IA/IADocumenti.tsx`.
- `Analizza` e attivo e verificato davvero in runtime.
- La review si apre da nuovo risultato o da storico.
- La review storica si riapre tramite `reviewDocumentId` e `reviewSourceKey`.
- Le route finali oggi usate sono:
- `/next/magazzino?tab=inventario`
- `/next/manutenzioni?targa=<targa>`
- `/next/dossier/<targa>#preventivi`
- Le scritture reali documentali esistono nel codice e non sono state esercitate in questo audit:
- upload Storage
- save Firestore
- update valuta
- import inventario
- Le scritture IA non business oggi attive sono locali e namespaced:
- `@next_internal_ai:universal_requests_v1`
- `@next_internal_ai:tracking_memory_v1`
- `@next_internal_ai:artifact_archive_v1`
- Errori runtime reali ancora aperti:
- `403` sui listing Storage Firebase
- `Maximum update depth exceeded`

## Prossimo passo consigliato
- Non rifare la UI a pezzi.
- Prima fissare una decisione di prodotto su:
- ingresso unico definitivo
- ruolo definitivo di `/next/ia/documenti`
- una sola review ufficiale
- una sola sede ufficiale dello storico
- ruolo definitivo del motore `Documenti IA`

## Documentazione sincronizzata in questo task
- `docs/STATO_ATTUALE_PROGETTO.md`
- `CONTEXT_CLAUDE.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
