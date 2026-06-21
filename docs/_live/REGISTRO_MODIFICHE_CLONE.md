# REGISTRO MODIFICHE CLONE

## 2026-06-21 2042

DATA: `2026-06-21`
TITOLO: `Card Home anomalie rifornimenti`
FILE TOCCATI: `src/next/NextHomePage.tsx`, `src/next/NextCentroControlloParityPage.tsx`, `src/next/helpers/refuelAnomalies.ts`, `src/next/components/NextCentroControlloIndagineModal.tsx`, `CONTEXT_CLAUDE.md`, `docs/_live/REGISTRO_MODIFICHE_CLONE.md`
COSA: `La Home NEXT sostituisce Ordini in attesa con Anomalie rifornimenti. Il conteggio usa la stessa regola del Report rifornimenti e il click apre direttamente il tab rifornimenti con filtro anomalie e modale indagine.`
ESITO: `FATTO`
NOTE: `Backup creato in backups/codex-20260621-home-anomalie. Verifiche: eslint mirato OK, build canonica OK, diff check OK, smoke browser Home -> modale OK. Nessun writer, barrier o dataset modificato.`

## 2026-06-21 2006

DATA: `2026-06-21`
TITOLO: `Microcopy consumo sospetto`
FILE TOCCATI: `src/next/NextCentroControlloParityPage.tsx`, `src/next/components/NextCentroControlloIndagineModal.tsx`, `docs/_live/REGISTRO_MODIFICHE_CLONE.md`
COSA: `Rimossi dai testi UI del consumo sospetto i riferimenti espliciti al furto. Restano indicazioni operative neutre su percorso, carico, ricevuta e possibili errori km/litri.`
ESITO: `FATTO`
NOTE: `Backup creato in backups/codex-20260621-200622. Nessuna modifica a calcolo, writer, barrier, route o dataset.`

## 2026-06-21 1947

DATA: `2026-06-21`
TITOLO: `Consumi sospetti Report rifornimenti`
FILE TOCCATI: `src/next/NextCentroControlloParityPage.tsx`, `src/next/components/NextCentroControlloIndagineModal.tsx`, `src/next/types/centroControlloTypes.ts`, `src/next/next-centro-controllo.css`, `src/utils/pdfEngine.ts`, `CONTEXT_CLAUDE.md`, `docs/_live/REGISTRO_MODIFICHE_CLONE.md`
COSA: `Il Report rifornimenti NEXT distingue errori dati e consumi sospetti. La nuova regola legge solo rifornimenti gia caricati: ultimi 20 validi dello stesso autista sulla stessa targa, con segnale se il km/L corrente e oltre il 30% peggiore della media storica.`
ESITO: `FATTO`
NOTE: `Verifiche: eslint mirato OK, build canonica OK. Backup creato in backups/codex-20260621-193327. Nessun writer, barrier, route o dataset modificato.`

## 2026-06-21 1855

DATA: `2026-06-21`
TITOLO: `Fix seed anomalie rifornimenti`
FILE TOCCATI: `src/next/NextCentroControlloParityPage.tsx`, `CONTEXT_CLAUDE.md`, `docs/_live/REGISTRO_MODIFICHE_CLONE.md`
COSA: `Nel Report rifornimenti NEXT il confronto anomalie usa ora il rifornimento precedente per data/targa con km valido, senza filtrarlo per km minori del record corrente. Questo consente di rilevare anche km tornati indietro o invariati. Home KPI non ancora modificata.`
ESITO: `FATTO`
NOTE: `Verifiche: diff check OK, eslint mirato OK, build canonica OK. Backup creato in backups/codex-20260621-185525.`

## 2026-06-21 1734

DATA: `2026-06-21`
TITOLO: `Riorganizzazione Report rifornimenti Centro Controllo`
FILE TOCCATI: `src/next/NextCentroControlloParityPage.tsx`, `src/next/next-centro-controllo.css`, `CONTEXT_CLAUDE.md`
COSA: `Spostato Report rifornimenti nella tabbar alta accanto ad Archivio storico. Rimosse dalla Sinottica le viste tabellari basse Segnalazioni autisti e Controlli KO/OK, mantenendo dati, chip, modale evento, writer e flussi rifornimenti invariati.`
ESITO: `FATTO`
NOTE: `Verifiche: eslint mirato OK, diff check OK, build canonica OK, smoke Playwright OK su Sinottica, Archivio, Report rifornimenti, analisi consumi, modale modifica e anteprima PDF mensile.`

## 2026-06-21 0732

DATA: `2026-06-21`
TITOLO: `Rimozione Export libretti dalla sidebar NEXT`
FILE TOCCATI: `src/next/nextData.ts`, `CONTEXT_CLAUDE.md`
COSA: `Rimossa dalla sidebar IA NEXT la voce Export libretti. La route /next/libretti-export, il pulsante nel tab Libretti di Documenti, il domain reader e la preview PDF restano invariati.`
ESITO: `FATTO`
NOTE: `Verifiche: lint mirato, diff check, build canonica e smoke Playwright sidebar/documenti.`

## 2026-06-20 2137

DATA: `2026-06-20`
TITOLO: `Rimozione ritorno Gestione Operativa da Sinottica`
FILE TOCCATI: `src/next/NextCentroControlloParityPage.tsx`, `CONTEXT_CLAUDE.md`
COSA: `Rimosso dalla Sinottica NEXT il bottone alto Torna a Gestione Operativa. Nessuna modifica a route /next/gestione-operativa, redirect, writer, barrier o dataset.`
ESITO: `FATTO`
NOTE: `Verifiche: eslint mirato OK, diff check OK, Playwright su /next/centro-controllo con backButtonCount 0. Dismissione della route hub analizzata ma non eseguita.`

## 2026-06-20 2121

DATA: `2026-06-20`
TITOLO: `Rinomina label Sinottica e Importa documenti`
FILE TOCCATI: `src/next/nextData.ts`, `src/next/NextHomePage.tsx`, `src/next/NextCentroControlloPage.tsx`, `src/next/components/HomeAlertCard.tsx`, `src/next/components/HomeInternalAiLauncher.tsx`, `src/next/internal-ai/*`, `docs/_live/spec/*IA*.md`, `CONTEXT_CLAUDE.md`
COSA: `Rinominati solo testi visibili NEXT: Alert diventa Sinottica e Archivista documenti diventa Importa documenti. Route /next/ia/archivista, barrier, writer, dataset e identificatori tecnici Archivista* restano invariati.`
ESITO: `FATTO`
NOTE: `Verifiche: grep testi vecchi runtime pulito, diff check OK, eslint mirato OK con 1 warning hook preesistente, build canonica OK.`

## 2026-06-20 1734

DATA: `2026-06-20`
TITOLO: `Runtime card Da fare manutenzioni`
FILE TOCCATI: `src/next/NextManutenzioniPage.tsx`, `src/next/next-mappa-storico.css`, `docs/_live/spec/SPEC_MANUTENZIONI_UI_NEXT.md`, `CONTEXT_CLAUDE.md`
COSA: `Implementato nel runtime reale il mockup accettato della sola card Da fare: filtri Urgenza/Origine, Azzera filtri, Segnalazioni aperte, Manutenzioni operative compatte e menu azioni visibile. La card ora occupa tutta l'area utile del tab, con controlli interni compatti.`
ESITO: `FATTO`
NOTE: `Verifiche: diff check, eslint mirato, build canonica e smoke Playwright su /next/manutenzioni con viewport 1878px, gap destro 0 e menu visibile.`

## 2026-06-20 1618

DATA: `2026-06-20`
TITOLO: `Mockup card Da fare manutenzioni`
FILE TOCCATI: `docs/_live/mockup/MOCKUP_CARD_DAFARE_MANUTENZIONI_V1.html`
COSA: `Creato mockup mirato alla sola card manutenzione Da fare, separato dal mockup pagina. La card mantiene checkbox, badge, frase storia, Eseguita, menu gruppo, Modifica e Apri.`
ESITO: `FATTO`
NOTE: `Verifiche: HTTP locale 200 e smoke Playwright su menu card e modale Eseguita.`

## 2026-06-20 1611

DATA: `2026-06-20`
TITOLO: `Mockup Da fare manutenzioni`
FILE TOCCATI: `docs/_live/mockup/MOCKUP_DAFARE_MANUTENZIONI_V2.html`
COSA: `Creato mockup HTTP statico per una UI alternativa della tab Da fare in Manutenzioni, con funzioni originali rappresentate: filtri, segnalazioni, gruppi, completamento, modifica, apertura e agganci. Nessuna modifica runtime.`
ESITO: `FATTO`
NOTE: `Verifiche: HTTP locale 200 e smoke Playwright su menu azioni e modale Eseguita.`

## 2026-06-19 1905

DATA: `2026-06-19`
TITOLO: `Dettaglio gomme multi-asse NEXT`
FILE TOCCATI: `src/next/domain/nextGommeSelectionReadOnly.ts`, `src/next/domain/nextManutenzioniDomain.ts`, `src/next/NextMappaStoricoPage.tsx`, `src/next/NextManutenzioniPage.tsx`
COSA: `Il dettaglio gomme NEXT ora legge tutti gli assi della selezione ordinaria multi-asse, anche per record gia salvati ricostruendo dagli id gomme. La scheda mostra quantita gomme e motivo ordinario invece di non indicato.`
ESITO: `FATTO`
NOTE: `Verifiche: tsc, test mirati gomme/manutenzioni, lint mirato e build canonica.`

## 2026-06-19 1841

DATA: `2026-06-19`
TITOLO: `Affinamento modale gomme NEXT`
FILE TOCCATI: `src/next/components/NextModalGomme.tsx`, `src/next/components/next-modal-gomme.css`, `src/next/NextManutenzioniPage.tsx`
COSA: `Rimosso il percorso guidato dal modale gomme NEXT; su desktop/portatile foto tecnica e vista dall'alto sono affiancate, senza sfondo a griglia e senza tagli della vista tecnica. La conferma del modale precompila/aggiorna la descrizione intervento con il riepilogo cambio gomme.`
ESITO: `FATTO`
NOTE: `I file docs/_live/STATO_ATTUALE_PROGETTO.md e docs/_live/STATO_MIGRAZIONE_NEXT.md non sono presenti e non sono stati creati.`

## 2026-06-19 1456

DATA: `2026-06-19`
TITOLO: `Fix multi-asse gomme NEXT`
FILE TOCCATI: `src/next/components/NextModalGomme.tsx`, `src/next/NextManutenzioniPage.tsx`
COSA: `Nel modale gomme NEXT la modalita ordinaria consente ora piu assi completi SX+DX senza sostituire la selezione precedente. Il salvataggio usa fallback espliciti da contesto e record sorgente per targa, descrizione e data quando si salva da dettaglio/completamento.`
ESITO: `FATTO`
NOTE: `Verifiche: tsc, lint mirato, test mirati gomme/manutenzioni e build canonica.`

## 2026-06-19 0850

DATA: `2026-06-19`
TITOLO: `Restyling modale gomme NEXT`
FILE TOCCATI: `src/next/components/NextModalGomme.tsx`, `src/next/components/next-modal-gomme.css`
COSA: `Sostituita solo la UI del modale gomme manutenzioni NEXT con layout guidato, foto laterale tecnica, vista dall'alto e slot gomme. Ordinario per asse seleziona sempre SX+DX; straordinario resta puntuale. App autisti e madre non toccate.`
ESITO: `FATTO`
NOTE: `Verifiche: tsc, lint mirato, test mirati gomme/manutenzioni e build canonica.`

## 2026-06-18 2049

DATA: `2026-06-18`
TITOLO: `Modale gomme manutenzioni NEXT`
FILE TOCCATI: `src/next/NextManutenzioniPage.tsx`, `src/next/components/NextModalGomme.tsx`, `src/next/domain/nextManutenzioniDomain.ts`, `src/next/domain/nextGommeSelectionReadOnly.ts`
COSA: `Nel form /next/manutenzioni la selezione gomme usa il modale visuale clone-safe equivalente all'app autisti, in inserimento, modifica e completamento. Il record @manutenzioni salva anche la nuova shape additiva gommeSelezione, usata dal dettaglio tecnico.`
ESITO: `FATTO`
NOTE: `Verifiche: tsc, test mirati, lint mirato e build canonica.`

## 2026-06-17 1520

DATA: `2026-06-17`
TITOLO: `Export PDF scadenze NEXT`
FILE TOCCATI: `src/next/NextScadenzeCollaudiPage.tsx`, `src/next/nextScadenzePdf.ts`, `src/next/next-scadenze.css`, `src/next/__tests__/nextScadenzePdf.test.ts`
COSA: `Aggiunto export PDF locale per /next/scadenze-collaudi con filtro categoria e anteprima condivisa. Il builder PDF e' isolato e non modifica il motore PDF condiviso o la write barrier.`
ESITO: `FATTO`
NOTE: `Verifiche: lint mirato, vitest mirato, build canonica.`

## 2026-06-17 1611

DATA: `2026-06-17`
TITOLO: `Stile aziendale PDF scadenze`
FILE TOCCATI: `src/next/nextScadenzePdf.ts`, `src/next/__tests__/nextScadenzePdf.test.ts`, `CONTEXT_CLAUDE.md`, `docs/_live/REGISTRO_MODIFICHE_CLONE.md`
COSA: `Allineato il PDF scadenze allo stile aziendale dei PDF esistenti: sfondo crema, header beige, logo, footer standard e tabelle separate per categoria. Evitata l'intestazione di categoria isolata a fondo pagina.`
ESITO: `FATTO`
NOTE: `Verifiche: lint mirato, vitest mirato, build canonica, render PDF pagine 1-2.`

## 2026-06-17 1548

DATA: `2026-06-17`
TITOLO: `Sezioni categoria PDF scadenze`
FILE TOCCATI: `src/next/nextScadenzePdf.ts`, `src/next/__tests__/nextScadenzePdf.test.ts`, `CONTEXT_CLAUDE.md`, `docs/_live/REGISTRO_MODIFICHE_CLONE.md`
COSA: `Nel PDF scadenze con filtro Tutte, la tabella viene divisa in sezioni per categoria mantenendo l'ordinamento operativo dentro ogni sezione. I filtri di categoria singola restano invariati.`
ESITO: `FATTO`
NOTE: `Verifiche: lint mirato, vitest mirato, build canonica.`
