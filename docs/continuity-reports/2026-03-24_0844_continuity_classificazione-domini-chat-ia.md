# CONTINUITY REPORT - Classificazione domini chat IA

## Contesto generale
- Il progetto resta in fase clone NEXT read-only con madre intoccabile e sottosistema IA interno isolato.
- La chat era gia forte sulla prima verticale `D01 + D10 + D02`, ma fuori da quel perimetro ragionava ancora troppo come insieme di schermate o capability isolate.

## Modulo/area su cui si stava lavorando
- Chat IA interna NEXT
- Classificazione dominio-first del thread

## Stato attuale
- La chat riconosce ora i domini canonici del gestionale e mantiene forte solo la prima verticale `D01 + D10 + D02`.
- I domini `D03`, `D04`, `D05`, `D06`, `D07`, `D08`, `D09` vengono restituiti con risposta prudente: dominio, file/moduli, capability oggi disponibili, limiti e prossimo passo.
- Il thread mostra in modo sobrio dominio riconosciuto, affidabilita e formato output.

## Legacy o Next
- NEXT

## Stato area/modulo nella NEXT
- IMPORTATO READ-ONLY

## Cosa e gia stato importato/migrato
- Chat principale
- Selettore output
- Resa messaggi del thread
- Nessuna scrittura business

## Prossimo step di migrazione
- Se richiesto, aprire un task separato per scegliere il prossimo dominio da consolidare dopo la prima verticale, senza mischiare piu domini nello stesso intervento.

## Moduli impattati
- `src/next/internal-ai/internalAiChatOrchestrator.ts`
- `src/next/internal-ai/internalAiOutputSelector.ts`
- `src/next/NextInternalAiPage.tsx`

## Contratti dati coinvolti
- nessun contratto nuovo; solo classificazione e orientamento sopra domini gia documentati

## Ultime modifiche eseguite
- Aggiunta classificazione prudente per i domini `D03`-`D09`.
- Mantenuta la prima verticale come unico percorso forte della chat.
- Esposti in thread dominio riconosciuto, affidabilita e formato output.

## File coinvolti
- `src/next/internal-ai/internalAiChatOrchestrator.ts`
- `src/next/internal-ai/internalAiOutputSelector.ts`
- `src/next/NextInternalAiPage.tsx`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`

## Decisioni gia prese
- La chat deve ragionare per domini canonici del gestionale.
- La prima verticale forte resta `D01 + D10 + D02`.
- I domini esterni non vengono resi operativi in questo task: solo classificati e descritti in modo prudente.

## Vincoli da non rompere
- Madre intoccabile.
- Nessuna scrittura business o backend live nuovo.
- Nessuna espansione infrastrutturale IA.
- Nessun file fuori whitelist senza autorizzazione esplicita.

## Parti da verificare
- Da verificare quale dominio, dopo la prima verticale, meriti il prossimo consolidamento reale.
- Da verificare se convenga in futuro uniformare in un documento repo la tracciabilita dei prompt 66 e 68, oggi non rintracciabili come file nominati nel repository.

## Rischi aperti
- La classificazione testuale prudente non sostituisce ancora capability dati forti sui domini esterni.
- Alcune superfici NEXT e legacy coesistono ancora come UI del clone; il thread deve continuare a usare solo reader canonici quando il dominio e consolidato.

## Punti da verificare collegati
- Nessun nuovo punto formalizzato in `docs/product/REGISTRO_PUNTI_DA_VERIFICARE.md` da questo task.

## Prossimo passo consigliato
- Scegliere un solo dominio esterno e aprire un audit/patch separata, tenendo invariata la prima verticale e senza riaprire backend o bridge live.

## Cosa NON fare nel prossimo task
- Non trasformare la classificazione prudente in capability forte su piu domini insieme.
- Non riaprire rifornimenti, costi, documenti o procurement dentro il thread principale senza audit dedicato.
- Non toccare madre, routing globale o backend IA live.

## Commit/hash rilevanti
- NON ESEGUITO

## Documenti di riferimento da leggere
- `docs/STATO_ATTUALE_PROGETTO.md`
- `docs/data/DOMINI_DATI_CANONICI.md`
- `docs/product/CHECKLIST_IA_INTERNA.md`
- `docs/product/STATO_AVANZAMENTO_IA_INTERNA.md`
- `docs/architecture/LINEE_GUIDA_SOTTOSISTEMA_IA_INTERNA.md`
- `docs/product/STATO_MIGRAZIONE_NEXT.md`
- `docs/product/REGISTRO_MODIFICHE_CLONE.md`
