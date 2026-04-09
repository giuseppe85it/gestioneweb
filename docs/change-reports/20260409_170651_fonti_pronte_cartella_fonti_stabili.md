# Change Report - 2026-04-09 17:06:51

## Contesto
- Prompt: `PROMPT37B`
- Ambito: documentazione operativa e continuita fonti
- Rischio: `NORMALE`

## Obiettivo
Creare una cartella unica e stabile `docs/fonti-pronte/` che raccolga le fonti piu importanti del progetto e fissare una regola permanente di sincronizzazione tra file sorgente e copie mirror.

## File toccati
- `AGENTS.md`
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
- `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md`
- `docs/product/PROTOCOLLO_SICUREZZA_MODIFICHE.md`
- `docs/architecture/PROCEDURA_MADRE_TO_CLONE.md`
- `CONTEXT_CLAUDE.md`
- `docs/fonti-pronte/*`

## Modifiche applicate
- creata la cartella `docs/fonti-pronte/`;
- aggiunti indice e overview sintetica;
- fissata in `AGENTS.md` e nei documenti guida la regola permanente: quando cambia un file sorgente mirrorato, va aggiornata anche la sua copia in `docs/fonti-pronte/`;
- predisposta la cartella per diventare la fonte unica da usare nelle future chat.

## Verifiche eseguite
- nessun build runtime: task solo documentale.

## Esito
- `PATCH COMPLETATA`
- nessun file `src/*` toccato
- regola permanente documentata
