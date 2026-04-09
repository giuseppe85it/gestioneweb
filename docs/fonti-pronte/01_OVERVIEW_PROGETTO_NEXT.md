# OVERVIEW PROGETTO NEXT

## Scopo
Questa overview sintetizza, usando solo fonti gia presenti nel repo, come e organizzato il progetto e dove leggere i punti chiave della NEXT.

## Struttura generale
- La madre legacy resta l'app operativa principale su `/`.
- Il clone/NEXT vive sotto `/next/*`.
- La regola architetturale stabile e: madre intoccabile, evoluzione applicativa concentrata in `src/next/*`.

## Cartelle chiave del repo
- `src/pages/*`: runtime legacy/madre.
- `src/next/*`: pagine, shell e moduli NEXT.
- `src/next/domain/*`: reader/domain NEXT e accesso dati normalizzato.
- `src/autisti/*`: app autisti legacy.
- `src/autistiInbox/*`: inbox/admin autisti legacy.
- `src/utils/*`: helper condivisi, barrier clone, PDF, formattazioni.
- `backend/internal-ai/*`: backend separato della IA interna NEXT.
- `docs/*`: stato progetto, architettura, dati, audit, change report, continuity report.

## Moduli NEXT principali
- Shell NEXT e macro-aree sotto `/next/*`.
- Mezzi e Dossier.
- Operativita globale.
- Procurement.
- Euromecc.
- IA interna.
- Autisti/InBox clone.

## Fonti piu utili per capire la NEXT
- `AGENTS.md`: regole operative primarie.
- `STATO_ATTUALE_PROGETTO.md`: stato generale aggiornato.
- `STATO_MIGRAZIONE_NEXT.md`: diario operativo del clone/NEXT.
- `REGISTRO_MODIFICHE_CLONE.md`: storico ufficiale delle patch clone.
- `CONTEXT_CLAUDE.md`: contesto sintetico per handoff rapidi.
- `PROCEDURA_MADRE_TO_CLONE.md`: regola architetturale per parity e ricostruzione clone.
- `REGISTRO_PUNTI_DA_VERIFICARE.md`: dubbi aperti da non perdere.

## Stato architetturale attuale
- La NEXT non e globalmente `CHIUSA`.
- Alcuni moduli hanno deroghe chirurgiche in scrittura, ma il perimetro generale resta controllato.
- I report esecutivi non bastano per chiudere un modulo: servono prove reali nel repo e, per i casi grandi, audit separati.

## Come usare questa cartella
- Se devi spiegare il progetto in una nuova chat, apri prima `00_INDICE_FONTI_PRONTE.md`.
- Se devi toccare la NEXT, leggi almeno `AGENTS.md`, `STATO_ATTUALE_PROGETTO.md`, `STATO_MIGRAZIONE_NEXT.md`, `CONTEXT_CLAUDE.md` e il report/audit del modulo interessato.
