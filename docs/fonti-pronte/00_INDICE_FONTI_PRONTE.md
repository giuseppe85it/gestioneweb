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

16. `AUDIT_FINALE_MAGAZZINO_NEXT_DOMINIO_2026-04-10.md`
- Audit finale strutturale del dominio `Magazzino NEXT`.
- Utile per capire cosa risulta davvero `CHIUSO`, cosa resta `PARZIALE` e quali gap bloccano ancora la chiusura del dominio.

17. `20260410_123000_audit_finale_magazzino_next_dominio.md`
- Change report dell'audit finale `Magazzino NEXT`.
- Utile per ricostruire in breve perimetro, documenti toccati e verdetto finale senza rileggere tutto l'audit.

18. `20260410_123000_continuity_audit_finale_magazzino_next_dominio.md`
- Continuity report dell'audit finale `Magazzino NEXT`.
- Utile per riprendere il prossimo task tecnico senza riaprire l'intera investigazione.

19. `20260410_164500_magazzino_next_contratto_stock_condiviso_execution.md`
- Change report della patch sul contratto stock condiviso `Magazzino NEXT`.
- Utile per capire UDM canoniche, matching materiale, deduplica documenti/arrivi e writer AdBlue/manutenzioni allineati.

20. `20260410_164500_continuity_magazzino_next_contratto_stock_condiviso_execution.md`
- Continuity report della patch stock `Magazzino NEXT`.
- Utile per riaprire rapidamente il contesto del contratto condiviso senza rifare l'analisi completa del dominio.

21. `20260410_125234_magazzino_next_autonomia_stock_execution.md`
- Change report della patch di autonomia stock `Magazzino NEXT`.
- Utile per capire come gli arrivi procurement vengono consolidati in `Magazzino` e come il procurement resta supporto/read-only.

22. `20260410_125234_continuity_magazzino_next_autonomia_stock_execution.md`
- Continuity report della patch di autonomia stock `Magazzino NEXT`.
- Utile per riaprire rapidamente il contesto della centralizzazione stock lato NEXT senza rifare l'analisi completa.

23. `20260410_190500_ia_interna_magazzino_readonly_execution.md`
- Change report dell'integrazione read-only tra IA interna NEXT e dominio `Magazzino`.
- Utile per capire capability D05 strutturata, dataset letti, handoff verso `/next/magazzino` e rischio residuo sul planner universale.

24. `20260410_190500_continuity_ia_interna_magazzino_readonly_execution.md`
- Continuity report dell'integrazione IA interna `Magazzino`.
- Utile per riaprire rapidamente il contesto della capability read-only Magazzino senza rifare l'analisi del task.

25. `01_OVERVIEW_PROGETTO_NEXT.md`
- Sintesi breve della struttura NEXT e dei file chiave del repo.
- Utile come briefing iniziale veloce.

26. `20260410_160342_ia_interna_magazzino_fatture_write_exception_execution.md`
- Change report della deroga scrivente controllata IA interna per le sole fatture `Magazzino`.
- Utile per capire perimetro, casi ammessi (`MARIBA` e `AdBlue`), anti-doppio-carico e file runtime/documentali toccati.

27. `20260410_160342_continuity_ia_interna_magazzino_fatture_write_exception_execution.md`
- Continuity report della deroga scrivente fatture `Magazzino`.
- Utile per riaprire rapidamente il contesto della patch senza rifare l'analisi completa.

28. `CHECKLIST_IA_INTERNA.md`
- Checklist operativa unica del sottosistema IA interna.
- Utile per capire cosa e davvero `FATTO`, cosa resta `IN CORSO` e quali task IA non sono completi senza aggiornamento checklist.

29. `STATO_AVANZAMENTO_IA_INTERNA.md`
- Quadro esteso di contesto, fasi, rischi e fatti verificati del sottosistema IA interna.
- Utile per riaprire una chat IA senza ricostruire tutta la storia tecnica del modulo.

30. `20260410_181242_ia_interna_magazzino_document_driven_execution.md`
- Change report della UX document-driven `Magazzino` nella chat IA interna.
- Utile per capire come l'allegato guida ora classificazione, proposta azione e handoff senza prompt rigidi.

31. `20260410_181242_continuity_ia_interna_magazzino_document_driven_execution.md`
- Continuity report della UX document-driven `Magazzino`.
- Utile per riprendere rapidamente il tema senza rileggere tutti i file runtime.

## Ordine rapido consigliato per una nuova chat
1. `AGENTS.md`
2. `STATO_ATTUALE_PROGETTO.md`
3. `STATO_MIGRAZIONE_NEXT.md`
4. `CONTEXT_CLAUDE.md`
5. `CHECKLIST_IA_INTERNA.md` se il task tocca la IA interna
6. `STATO_AVANZAMENTO_IA_INTERNA.md` se il task tocca la IA interna
7. `REGISTRO_PUNTI_DA_VERIFICARE.md`
8. `PROTOCOLLO_SICUREZZA_MODIFICHE.md`
9. `PROCEDURA_MADRE_TO_CLONE.md`
10. Audit o report specifici del modulo da toccare

## Nota pratica
Se devi passare fonti essenziali in una nuova chat, inizia da questa cartella invece di cercare i documenti in tutto il repo.
