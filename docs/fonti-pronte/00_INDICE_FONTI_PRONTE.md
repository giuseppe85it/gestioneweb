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

32. `20260410_234600_ia_interna_modal_ui_fix_execution.md`
- Change report del fix UI sul modale IA interna.
- Utile per capire perche il pannello proposta documento non e piu schiacciato nel composer.

33. `20260410_234600_continuity_ia_interna_modal_ui_fix_execution.md`
- Continuity report del fix UI sul modale IA interna.
- Utile per riaprire il tema della leggibilita del modale senza rifare il debug del layout.

34. `20260411_003500_ia_interna_document_dossier_ui_execution.md`
- Change report del rifacimento dossier della scheda documento IA interna.
- Utile per capire la nuova impaginazione gestionale del risultato documento senza toccare motore o writer.

35. `20260411_003500_continuity_ia_interna_document_dossier_ui_execution.md`
- Continuity report del rifacimento dossier UI documento IA interna.
- Utile per riaprire rapidamente il tema della resa visiva del documento analizzato.

36. `20260411_083921_ia_interna_magazzino_inline_confirm_execute_execution.md`
- Change report della patch che porta conferma, esecuzione ed esito inline `Magazzino` nel modale IA interna.
- Utile per capire scoped allowance del barrier, helper inline controllato e limiti reali del dataset verificato.

37. `20260411_083921_continuity_ia_interna_magazzino_inline_confirm_execute_execution.md`
- Continuity report della patch inline `Magazzino` nella IA interna.
- Utile per riaprire rapidamente il tema del flusso conferma -> esecuzione -> esito senza rifare l'analisi completa.

38. `20260411_170658_ia_interna_magazzino_fullscreen_document_review_execution.md`
- Change report della patch che sostituisce la review documentale dispersiva con una schermata full screen operativa nella IA interna `Magazzino`.
- Utile per capire layout, decision cards, fallback modulo e nuova centralita visiva del documento.

39. `20260411_170658_continuity_ia_interna_magazzino_fullscreen_document_review_execution.md`
- Continuity report della review documento full screen `Magazzino`.
- Utile per riaprire rapidamente il task sapendo cosa e stato verificato a runtime e quali rischi residui restano aperti.

40. `20260411_202032_ia_interna_magazzino_document_extraction_pipeline_execution.md`
- Change report della patch che introduce la pipeline documentale reale per PDF e immagini nella IA interna `Magazzino`.
- Utile per capire backend IA separato, payload `documentAnalysis`, routing corretto tra materiali / AdBlue / preventivo / ambiguo e nuovi campi righe.

41. `20260411_202032_continuity_ia_interna_magazzino_document_extraction_pipeline_execution.md`
- Continuity report della pipeline documentale reale `Magazzino`.
- Utile per riaprire rapidamente il task con i file chiave, le verifiche runtime gia eseguite e i rischi residui su OCR/PDF sporchi.

42. `20260411_214553_magazzino_ia_fix_riconciliazione_stock_review_destra_execution.md`
- Change report del fix che corregge la riconciliazione stock senza doppio incremento e rende piu utile la review destra della IA interna `Magazzino`.
- Utile per capire il nuovo gating `riconcilia_senza_carico`, la gerarchia `Documento -> Righe estratte -> Match -> Decisione -> Azione proposta -> Dettagli tecnici` e i limiti residui sul dataset live.

43. `20260411_214553_continuity_magazzino_ia_fix_riconciliazione_stock_review_destra_execution.md`
- Continuity report del fix `Magazzino` + IA interna su riconciliazione stock e review destra.
- Utile per riaprire rapidamente il task sapendo quali file runtime sono stati toccati, quali verifiche sono gia state eseguite e perche la prova end-to-end live resta `DA VERIFICARE`.

44. `20260411_233850_audit_runtime_magazzino_ia_fix_e2e.md`
- Change report dell'audit runtime reale sul fix `Magazzino` + IA interna.
- Utile per capire perche il dataset live non offre ancora un candidato documentale `Pronto`, quali evidenze sono state raccolte su `/next/magazzino?tab=documenti-costi` e come la review IA si comporta nel live persistito corrente.

45. `20260411_233850_continuity_audit_runtime_magazzino_ia_fix_e2e.md`
- Continuity report dell'audit runtime reale sul fix `Magazzino` + IA interna.
- Utile per riaprire rapidamente il tema sapendo che il fix non e stato smentito dal runtime, ma che la prova end-to-end resta sospesa per assenza di casi documentali live eseguibili.

46. `20260411_dossier_fattura_to_manutenzione.md`
- Change report del flusso "Fattura → Manutenzione" nel Dossier Mezzo NEXT.
- Utile per capire `sourceDocumentId`, il modal IA, la deroga barrier Dossier e il bottone/badge anti-duplicazione.

47. `20260411_continuity_dossier_fattura_to_manutenzione.md`
- Continuity report del flusso "Fattura → Manutenzione" nel Dossier Mezzo NEXT.
- Utile per riaprire rapidamente il tema sapendo cosa e stato verificato, cosa resta DA VERIFICARE e i punti di attenzione tecnici.

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
