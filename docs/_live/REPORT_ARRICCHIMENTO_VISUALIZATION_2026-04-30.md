# REPORT ARRICCHIMENTO VISUALIZATION CHAT IA NEXT - 2026-04-30

## 1. Obiettivo
Correggere i limiti UX emersi nei test utente sulle domande argute D1-D9: dati troppo poveri, blocchi visualization incompleti, risultati non cliccabili, confronto diretto ambiguo, assenza di copia messaggio e manutenzioni analoghe non elencate.

## 2. Interventi principali
- Esteso il contratto blocchi in `chatIaTypes.ts` con `metadata`, `action`, `comparisonLabel`, `rowActions` e nuovo blocco `nested_list`.
- Esteso lo schema strict backend per accettare i nuovi campi e `nested_list`.
- Arricchito `analytics.ts` per passare piu dati business ai blocchi: descrizioni, referenti, stati, fornitori, importi, costi, categorie, rifornimenti e riferimenti documento.
- Aggiornato `visualization.ts` per produrre piu tabelle, nested list D2, confronto con titolo chiaro e azioni navigabili.
- Aggiornati renderer React dei blocchi per mostrare metadati, descrizioni troncate con title, link `Apri`, nested list e confronto leggibile.
- Aggiunto pulsante `Copia` in `ChatIaMessageItem.tsx`.

## 3. Mappatura click
- Mezzo: `/next/dossier/{targa}`.
- Manutenzione: `/next/manutenzioni?targa=...&recordId=...`.
- Lavoro: `/next/dettagliolavori/{id}` oppure lista lavori se l'id manca.
- Documento/fattura: dossier mezzo se c'e targa, altrimenti `/next/ia/documenti`.
- Cantiere: `/next/attrezzature-cantieri?cantiere=...`.
- Autista: `/next/anagrafiche?tab=colleghi`.

## 4. Test
- Esteso `tests/e2e/05-domandeArgute.spec.ts` con assertion su descrizioni, fornitori, importi, confronto chiaro, nested list e link.
- Creato `tests/e2e/08-cliccabilita.spec.ts` con 5 domini navigabili: mezzo, manutenzione, autista, documento/dossier, cantiere.
- Creato `tests/e2e/09-copia.spec.ts` per clipboard e feedback `Copiato`.

## 5. Verifiche
- `npm run build`: OK.
- Lint mirato: OK.
- `node --check backend/internal-ai/server/internal-ai-adapter.js`: OK.
- E2E mirati `05 + 08 + 09`: 15/15 PASS.
- Suite completa `npm run test:e2e`: 85 test PASS con 1 flaky storico recuperato al retry.

## 6. Esito
`FATTO`.

La visualization multi-agente ora espone dati operativi azionabili e navigabili. D2 non si limita piu a dichiarare analogie: le elenca in un blocco dedicato. Il confronto D5/D7 ha titolo esplicito. Ogni risposta assistente puo essere copiata.

## 7. Note residue
- I test storici tool-use restano lenti per timeout/provider; nel run completo un test fattura n.81 e passato al retry dopo timeout al primo tentativo.
- Nessun reader, tool registry, madre o archivista e stato modificato.
