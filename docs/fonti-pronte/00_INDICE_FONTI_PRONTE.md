# INDICE FONTI PRONTE

## Scopo
`docs/fonti-pronte/` e la cartella unica da aprire quando serve recuperare in fretta le fonti piu utili del progetto per una nuova chat, un handoff o un riallineamento rapido.

Contiene copie mirror di documenti sorgente chiave e alcuni report selezionati.

## Regola permanente
- Quando un file sorgente gia specchiato qui dentro viene aggiornato, nello stesso task va aggiornata anche la sua copia in `docs/fonti-pronte/`.
- Se l'elenco dei file utili cambia, aggiornare anche questo indice.
- Questa cartella non sostituisce le fonti sorgente: le concentra in un unico posto.

## File presenti e uso consigliato
1. `AGENTS.md`
- Regole operative primarie di Codex nel repo.
- Da leggere sempre per capire confini, whitelist, chiusura moduli e regole di rischio.

2. `STATO_ATTUALE_PROGETTO.md`
- Stato operativo generale del progetto.
- Utile per capire subito i task recenti, i moduli toccati e lo stato globale.

3. `STATO_MIGRAZIONE_NEXT.md`
- Diario operativo della migrazione NEXT.
- Utile per capire cosa e gia stato fatto nel clone/NEXT e cosa resta `PARZIALE`.

4. `REGISTRO_MODIFICHE_CLONE.md`
- Registro storico ufficiale delle patch clone/NEXT.
- Utile per ricostruire rapidamente file toccati, obiettivi e verifiche.

5. `CONTEXT_CLAUDE.md`
- Contesto sintetico per assistant esterni.
- Utile come base breve quando serve spiegare in poche pagine stack, moduli e convenzioni.

6. `REGISTRO_PUNTI_DA_VERIFICARE.md`
- Elenco strutturato dei dubbi ancora aperti.
- Utile per evitare di dichiarare chiuso cio che e ancora `DA VERIFICARE`.

7. `PROTOCOLLO_SICUREZZA_MODIFICHE.md`
- Regole di impatto, rischio e blocco patch cieche.
- Utile prima di patch rischiose o cross-modulo.

8. `PROCEDURA_MADRE_TO_CLONE.md`
- Procedura architetturale per leggere la madre e ricostruire la NEXT.
- Utile quando un task tocca parity, route o boundary clone.

9. `AUDIT_MANUTENZIONI_NEXT_CROSSMODULO_PROMPT32_2026-04-09.md`
- Audit strutturale reale sul modulo `Manutenzioni` e collegamenti cross-modulo.
- Utile per capire perche il modulo resta `PARZIALE`.

10. `20260409_154405_manutenzioni_next_fix_crossmodulo_prompt34.md`
- Change report del fix cross-modulo piu importante recente su `Manutenzioni`.
- Utile per capire il bug `@materialiconsegnati` e gli allineamenti con Dossier/Operativita.

11. `20260409_154405_continuity_manutenzioni_next_fix_crossmodulo_prompt34.md`
- Continuity report del fix cross-modulo `Manutenzioni`.
- Utile per handoff rapido tra chat.

12. `20260409_201156_magazzino_next_prompt18s.md`
- Change report del nuovo modulo `Magazzino NEXT`.
- Utile per capire route `/next/magazzino`, barrier, dataset reali usati e perimetro della pagina unica.

13. `20260409_201156_continuity_magazzino_next_prompt18s.md`
- Continuity report del modulo `Magazzino NEXT`.
- Utile per handoff rapido sul nuovo runtime magazzino e sui rischi residui.

14. `20260409_222842_magazzino_next_dominio_allargato_execution.md`
- Change report della patch strutturale sul dominio allargato `Magazzino NEXT`.
- Utile per capire quarta vista `Documenti e costi`, preservazione shape multi-writer e compatibilita cross-modulo.

15. `20260409_222842_continuity_magazzino_next_dominio_allargato_execution.md`
- Continuity report della patch strutturale `Magazzino NEXT`.
- Utile per riaprire rapidamente il contesto del modulo senza rifare l'audit completo.

16. `01_OVERVIEW_PROGETTO_NEXT.md`
- Sintesi breve della struttura NEXT e dei file chiave del repo.
- Utile come briefing iniziale veloce.

## Ordine rapido consigliato per una nuova chat
1. `AGENTS.md`
2. `STATO_ATTUALE_PROGETTO.md`
3. `STATO_MIGRAZIONE_NEXT.md`
4. `CONTEXT_CLAUDE.md`
5. `REGISTRO_PUNTI_DA_VERIFICARE.md`
6. `PROTOCOLLO_SICUREZZA_MODIFICHE.md`
7. `PROCEDURA_MADRE_TO_CLONE.md`
8. Audit o report specifici del modulo da toccare

## Nota pratica
Se devi passare fonti essenziali in una nuova chat, inizia da questa cartella invece di cercare i documenti in tutto il repo.
