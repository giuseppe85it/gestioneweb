# REPORT REFACTORING MULTI-AGENTE CHAT IA NEXT - 2026-04-29

## 1. Esito
- Stato: FATTO
- Perimetro: Chat IA NEXT tool-use, orchestrazione multi-agente per domande analitiche D1-D9, rendering blocchi visualization, schema strict backend esteso.
- Nota documentale: il prompt chiedeva `docs/audit/REPORT_REFACTORING_MULTI_AGENTE_2026-04-29.md`; per regola attiva AGENTS la documentazione nuova viene creata in `docs/_live/`.

## 2. Architettura
- Orchestratore: `src/next/chat-ia/agents/orchestrator.ts`.
- Specialistici: Flotta, Operazioni, Documenti, Cisterna/Rifornimenti, Cantieri/Magazzino in `src/next/chat-ia/agents/specialists/*`.
- Supporto: Analytics deterministico in `src/next/chat-ia/agents/analytics.ts`; Visualization in `src/next/chat-ia/agents/visualization.ts`.
- Integrazione: `runToolUseConversation(...)` prova prima il percorso multi-agente solo per le 9 domande argute riconosciute; gli altri prompt restano sul tool-use backend precedente.
- Registry tool: non modificato; i tool esistenti sono solo distribuiti per agente e invocati tramite executor esistente.

## 3. Visualization
Blocchi renderizzati:
- `summary_card_big`
- `metric_card_grid`
- `comparison_split`
- `ranking_table`
- `trend_chart_line`
- `bar_chart_compare`
- `pie_chart`
- `timeline`
- `data_table_styled`
- `callout`
- `mixed_layout`

Componenti React in `src/next/chat-ia/components/blocks/*`; rendering agganciato in `ChatIaMessageItem.tsx`.

## 4. Test
- Nuovi test D1-D9: `tests/e2e/05-domandeArgute.spec.ts`
- Nuovi test visualization: `tests/e2e/06-visualization.spec.ts`
- Esecuzione mirata nuovi test: 13/13 PASS.
- Esecuzione completa: 75 test totali con 74 PASS diretti e 1 flaky recuperato al retry (`cisterna riconciliazione`, timeout al primo tentativo).
- Rilancio singolo del flaky: PASS in 32.3s.

## 5. Verifiche tecniche
- `npm run build`: OK.
- `node --check backend/internal-ai/server/internal-ai-adapter.js`: OK.
- Lint mirato sui file toccati e nuovi test: OK.
- `npm run lint` globale non usato come gate perche il repository ha baseline storico fuori perimetro.

## 6. Domande argute
- D1: PASS, blocchi summary, ranking, trend.
- D2: PASS, blocchi summary, timeline.
- D3: PASS, blocchi timeline, data table.
- D4: PASS, blocchi callout, data table.
- D5: PASS, blocchi metric grid, comparison, bar chart, ranking.
- D6: PASS, blocchi summary, ranking, pie chart, callout.
- D7: PASS, blocchi summary, comparison.
- D8: PASS, blocchi metric grid, data table.
- D9: PASS, blocchi mixed layout, bar chart, ranking, data table.

## 7. Rischi residui
- Il percorso multi-agente e attivo come orchestrazione deterministica locale sui tool esistenti per D1-D9; il flusso generale mono-agente backend resta fallback per preservare i 62 test storici.
- Alcune analisi cross-domain usano un campione operativo di mezzi noti quando i tool disponibili non espongono ancora aggregazioni fleet-wide complete per quel dominio.
- Il test storico `cisterna riconciliazione` ha mostrato un timeout temporaneo al primo tentativo ma e passato al retry e al rilancio singolo.

## 8. Vincoli rispettati
- Madre non toccata.
- Reader non modificati.
- Archivista non analizzato e non toccato.
- Tool registry non modificato.
- Nessun git commit.
