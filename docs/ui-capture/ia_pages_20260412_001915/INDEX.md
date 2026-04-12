# IA pages capture

- Generato: 2026-04-11T22:30:00.519Z
- Base URL: http://127.0.0.1:4173
- Screenshot catturati: 25
- Stati saltati: 0
- Errori: 0

| numero | nome file screenshot | route | file React/page sorgente | stato catturato | note minime utili |
| --- | --- | --- | --- | --- | --- |
| 1 | 01_next_ia_hub.png | /next/ia | src/next/NextIntelligenzaArtificialePage.tsx | vista iniziale | Hub NEXT con card strumenti e stato API key. |
| 2 | 02_next_ia_interna_overview.png | /next/ia/interna | src/next/NextInternalAiPage.tsx | overview iniziale | Vista principale del sottosistema IA interno. |
| 3 | 03_next_ia_interna_sessioni.png | /next/ia/interna/sessioni | src/next/NextInternalAiPage.tsx | sezione sessioni | Stessa pagina sorgente con sectionId='sessions'. |
| 4 | 04_next_ia_interna_richieste.png | /next/ia/interna/richieste | src/next/NextInternalAiPage.tsx | sezione richieste | Stessa pagina sorgente con sectionId='requests'. |
| 5 | 05_next_ia_interna_artifacts.png | /next/ia/interna/artifacts | src/next/NextInternalAiPage.tsx | sezione artifacts | Stessa pagina sorgente con sectionId='artifacts'. |
| 6 | 06_next_ia_interna_audit.png | /next/ia/interna/audit | src/next/NextInternalAiPage.tsx | sezione audit | Stessa pagina sorgente con sectionId='audit'. |
| 7 | 07_next_ia_apikey.png | /next/ia/apikey | src/next/NextIAApiKeyPage.tsx | vista iniziale | Pagina API key Gemini in versione NEXT. |
| 8 | 08_next_ia_libretto.png | /next/ia/libretto | src/next/NextIALibrettoPage.tsx | vista iniziale | Upload/analisi libretto lato NEXT. |
| 9 | 09_next_ia_libretto_archive.png | /next/ia/libretto?archive=1 | src/next/NextIALibrettoPage.tsx | archivio libretti | Stato archivio richiamato via query archive=1. |
| 10 | 10_next_ia_libretto_viewer.png | /next/ia/libretto?archive=1 | src/next/NextIALibrettoPage.tsx | viewer libretto aperto | Stato modale read-only aperto dal primo pulsante Apri Foto disponibile. Viewer libretto aperto in sola lettura. |
| 11 | 11_next_ia_documenti.png | /next/ia/documenti | src/next/NextIADocumentiPage.tsx | vista iniziale | Pagina documenti IA in versione NEXT. |
| 12 | 12_next_ia_copertura_libretti.png | /next/ia/copertura-libretti | src/next/NextIACoperturaLibrettiPage.tsx | vista iniziale | Tabella copertura libretti e foto in NEXT. |
| 13 | 13_next_libretti_export.png | /next/libretti-export | src/next/NextLibrettiExportPage.tsx | vista iniziale | Lista export libretti in NEXT. |
| 14 | 14_next_libretti_export_preview.png | /next/libretti-export | src/next/NextLibrettiExportPage.tsx | anteprima PDF aperta | Stato dialog read-only aperto selezionando il primo mezzo disponibile. Anteprima PDF aperta in sola lettura. |
| 15 | 15_next_cisterna_ia.png | /next/cisterna/ia | src/next/NextCisternaIAPage.tsx | vista iniziale | Verticale specialistico Cisterna IA in NEXT. |
| 16 | 16_legacy_ia_hub.png | /ia | src/pages/IA/IAHome.tsx | vista iniziale | Hub IA legacy. |
| 17 | 17_legacy_ia_apikey.png | /ia/apikey | src/pages/IA/IAApiKey.tsx | vista iniziale | Pagina API key Gemini legacy. |
| 18 | 18_legacy_ia_libretto.png | /ia/libretto | src/pages/IA/IALibretto.tsx | vista iniziale | Upload/analisi libretto legacy. |
| 19 | 19_legacy_ia_libretto_archive.png | /ia/libretto?archive=1 | src/pages/IA/IALibretto.tsx | archivio libretti | Stato archivio richiamato via query archive=1. |
| 20 | 20_legacy_ia_libretto_viewer.png | /ia/libretto?archive=1 | src/pages/IA/IALibretto.tsx | viewer libretto aperto | Stato modale read-only aperto dal primo pulsante Apri Foto disponibile. Viewer libretto legacy aperto in sola lettura. |
| 21 | 21_legacy_ia_documenti.png | /ia/documenti | src/pages/IA/IADocumenti.tsx | vista iniziale | Pagina documenti IA legacy. |
| 22 | 22_legacy_ia_copertura_libretti.png | /ia/copertura-libretti | src/pages/IA/IACoperturaLibretti.tsx | vista iniziale | Tabella copertura libretti e foto legacy. |
| 23 | 23_legacy_libretti_export.png | /libretti-export | src/pages/LibrettiExport.tsx | vista iniziale | Lista export libretti legacy. |
| 24 | 24_legacy_libretti_export_preview.png | /libretti-export | src/pages/LibrettiExport.tsx | anteprima PDF aperta | Stato dialog read-only aperto selezionando il primo mezzo disponibile. Anteprima PDF legacy aperta in sola lettura. |
| 25 | 25_legacy_cisterna_ia.png | /cisterna/ia | src/pages/CisternaCaravate/CisternaCaravateIA.tsx | vista iniziale | Verticale specialistico Cisterna IA legacy. |

## Route IA reali censite senza screenshot autonomo

| route | file sorgente | stato | note |
| --- | --- | --- | --- |
| /next/ia-gestionale | src/App.tsx -> NextLegacyIaRedirect | redirect tecnico | Route reale ma senza schermata autonoma: reindirizza a /next/ia. |
