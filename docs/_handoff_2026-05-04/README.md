# Handoff package 2026-05-04

Questa cartella contiene tutti i file necessari per riprendere il lavoro sul progetto Chat IA Zero-Invenzioni in una nuova chat Claude.

## Cosa fare nella chat nuova

1. Aprire una nuova chat dentro il Project "GestioneManutenzione".
2. Caricare TUTTI i file di questa cartella come allegati.
3. Come primo messaggio, scrivere:

```
Ciao Claude. Riparto dal lavoro sulla Chat IA Zero-Invenzioni.
Stato: post-audit copertura modali (PROMPT 20).
File caricati: handoff package 2026-05-04.

Ultime 7 decisioni operative prese (vedi DIARIO_DECISIONI.md):
1. Root @documenti_* sostituiscono storage/@documenti_*
2. Cisterna dentro motore v1
3. chat_ia_reports escluso formalmente
4. Foto come esistenza nel pannello prove (path si, URL no)
5. @analisi_economica_mezzi escluso (narrativa IA)
6. stamped/* fuori scope motore v1
7. Coordinate hotspot (x, y, areaId) ammesse

Prossimo passo: prompt patch lacune audit per applicare queste 7 decisioni al registro/boundary.

Riprendi tu da qui. Per scelte gia' fatte leggi DIARIO_DECISIONI.md.
```

## File contenuti

- `AGENTS.md` — protocollo agenti + regola "Esplorazione prima di asserzione"
- `PROTOCOLLO_SICUREZZA_MODIFICHE.md` — rules sicurezza modifiche
- `SPEC_CHAT_ZERO_INVENZIONI_NEXT.md` — spec rev 1.4
- `REGISTRO_COLLECTION_FIRESTORE.md` — mappa Firestore v0.5 + alias
- `DIARIO_DECISIONI.md` — registro decisioni strategiche append-only
- `STATO_ATTUALE_PROGETTO.md` — stato corrente
- `STATO_MIGRAZIONE_NEXT.md` — stato migrazione NEXT
- `REGISTRO_MODIFICHE_CLONE.md` — log modifiche clone
- `AUDIT_COPERTURA_MODALI_2026-05-04.md` — audit completo PROMPT 20
- `internal-ai-firebase-readonly-boundary.js` — boundary readonly attuale (38 collection)

## Roadmap residua dopo questo handoff

1. Patch lacune audit (chiude le 7 decisioni)
2. Motore generico data-driven
3. Fix Sandro end-to-end
4. Cleanup multi-agente
5. PDF report da template
