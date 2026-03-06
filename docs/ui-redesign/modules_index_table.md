# Modules Index Table — GestioneManutenzione

| Modulo | Area | Tipo | Fonte dati | Mezzo-centrico | Scrive | Legge | IA | PDF | Note |
|---|---|---|---|---|---|---|---|---|---|
| Home (`src/pages/Home.tsx`) | Centro di Controllo | Ibrido | `@mezzi_aziendali`, `@autisti_sessione_attive`, `@storico_eventi_operativi`, `@segnalazioni_autisti_tmp`, `@controlli_mezzo_autisti`, `@alerts_state` | parziale | si | si | parziale | si | Hub principale dashboard/admin |
| GestioneOperativa (`src/pages/GestioneOperativa.tsx`) | Centro di Controllo | Globale | `@inventario`, `@materialiconsegnati`, `@manutenzioni` | no | no | si | no | no | Hub operativo |
| CentroControllo (`src/pages/CentroControllo.tsx`) | Centro di Controllo | Ibrido | `@mezzi_aziendali`, `@rifornimenti`, `@rifornimenti_autisti_tmp`, `@controlli_mezzo_autisti`, `@segnalazioni_autisti_tmp`, `@richieste_attrezzature_autisti_tmp` | parziale | no | si | no | si | Priorita/manutenzioni/rifornimenti |
| Mezzi (`src/pages/Mezzi.tsx`) | Flotta | Mezzo-centrico | `@mezzi_aziendali`, `@colleghi` | si | si | si | parziale | no | Anagrafica mezzi |
| Manutenzioni (`src/pages/Manutenzioni.tsx`) | Flotta | Mezzo-centrico | `@manutenzioni`, `@mezzi_aziendali`, `@inventario`, `@materialiconsegnati` | si | si | si | no | si | Registro interventi + gomme |
| LavoriDaEseguire (`src/pages/LavoriDaEseguire.tsx`) | Flotta | Mezzo-centrico | `@lavori`, `@mezzi_aziendali` | si | si | si | no | no | Inserimento backlog lavori |
| LavoriInAttesa (`src/pages/LavoriInAttesa.tsx`) | Flotta | Mezzo-centrico | `@lavori`, `@mezzi_aziendali` | si | no | si | no | si | Vista attesa + export |
| LavoriEseguiti (`src/pages/LavoriEseguiti.tsx`) | Flotta | Mezzo-centrico | `@lavori`, `@mezzi_aziendali` | si | no | si | no | si | Storico chiusi + export |
| DettaglioLavoro (`src/pages/DettaglioLavoro.tsx`) | Flotta | Mezzo-centrico | `@lavori` | si | si | si | no | no | Edit singolo lavoro |
| CapoMezzi (`src/pages/CapoMezzi.tsx`) | Flotta | Mezzo-centrico | `storage/@mezzi_aziendali`, `storage/@costiMezzo`, `@documenti_*` | si | no | si | parziale | no | Vista management per targa |
| CapoCostiMezzo (`src/pages/CapoCostiMezzo.tsx`) | Flotta | Mezzo-centrico | `storage/@costiMezzo`, `@documenti_*`, `@preventivi_approvazioni` | si | si | si | parziale | si | Costi/approvazioni/PDF |
| DossierLista (`src/pages/DossierLista.tsx`) | Dossier Mezzo | Mezzo-centrico | `storage/@mezzi_aziendali` | si | no | si | no | no | Entry per categoria/targa |
| DossierMezzo (`src/pages/DossierMezzo.tsx`) | Dossier Mezzo | Mezzo-centrico | `storage/@mezzi_aziendali`, `storage/@lavori`, `storage/@materialiconsegnati`, `@rifornimenti_autisti_tmp`, `@manutenzioni`, `@documenti_*`, `storage/@costiMezzo` | si | si | si | parziale | si | Aggregatore centrale dossier |
| DossierGomme (`src/pages/DossierGomme.tsx`) | Dossier Mezzo | Mezzo-centrico | via `GommeEconomiaSection` (`storage/@manutenzioni`) | si | no | si | no | no | Wrapper dedicato gomme |
| DossierRifornimenti (`src/pages/DossierRifornimenti.tsx`) | Dossier Mezzo | Mezzo-centrico | via `RifornimentiEconomiaSection` (`storage/@rifornimenti`, `storage/@rifornimenti_autisti_tmp`) | si | no | si | no | no | Wrapper dedicato rifornimenti |
| Mezzo360 (`src/pages/Mezzo360.tsx`) | Dossier Mezzo | Mezzo-centrico | `@mezzi_aziendali`, `@autisti_sessione_attive`, `@storico_eventi_operativi`, `@manutenzioni`, `@lavori`, `@materialiconsegnati`, `@segnalazioni_autisti_tmp`, `@controlli_mezzo_autisti`, `@rifornimenti_autisti_tmp`, `@cambi_gomme_autisti_tmp`, `@gomme_eventi`, `@richieste_attrezzature_autisti_tmp`, `@documenti_*` | si | si | si | parziale | parziale | Timeline completa mezzo |
| Autista360 (`src/pages/Autista360.tsx`) | Dossier Mezzo | Ibrido | `@autisti_sessione_attive`, `@segnalazioni_autisti_tmp`, `@controlli_mezzo_autisti`, `@rifornimenti_autisti_tmp`, `@richieste_attrezzature_autisti_tmp`, `@cambi_gomme_autisti_tmp`, `@gomme_eventi`, `@storico_eventi_operativi` | parziale | no | si | no | parziale | Vista trasversale autista-eventi |
| Acquisti (`src/pages/Acquisti.tsx`) | Operativita | Globale | `@ordini`, `@preventivi`, `@listino_prezzi`, `@fornitori`, `@inventario` | no | si | si | parziale | si | Modulo esteso procurement |
| MaterialiDaOrdinare (`src/pages/MaterialiDaOrdinare.tsx`) | Operativita | Globale | `storage/@ordini`, `storage/@fornitori` | no | si | si | no | no | Inserimento ordini |
| OrdiniInAttesa (`src/pages/OrdiniInAttesa.tsx`) | Operativita | Globale | `@ordini` | no | no | si | no | si | Vista ordini pending |
| OrdiniArrivati (`src/pages/OrdiniArrivati.tsx`) | Operativita | Globale | `@ordini` | no | no | si | no | si | Vista ordini arrivati |
| DettaglioOrdine (`src/pages/DettaglioOrdine.tsx`) | Operativita | Globale | `@ordini`, `@inventario` | no | si | si | no | no | Stato ordine + aggiornamento stock |
| Colleghi (`src/pages/Colleghi.tsx`) | Operativita | Globale | `storage/@colleghi` | no | si | si | no | si | Anagrafica colleghi |
| Fornitori (`src/pages/Fornitori.tsx`) | Operativita | Globale | `storage/@fornitori` | no | si | si | no | si | Anagrafica fornitori |
| AttrezzatureCantieri (`src/pages/AttrezzatureCantieri.tsx`) | Operativita | Ibrido | `@attrezzature_cantieri` | parziale | si | si | no | si | Logistica attrezzature |
| Inventario (`src/pages/Inventario.tsx`) | Magazzino | Globale | `@inventario`, `storage/@fornitori` | no | si | si | no | si | Stock globale |
| MaterialiConsegnati (`src/pages/MaterialiConsegnati.tsx`) | Magazzino | Ibrido | `@inventario`, `@materialiconsegnati`, `@mezzi_aziendali`, `@colleghi` | parziale | si | si | no | si | Movimenti materiali |
| AnalisiEconomica (`src/pages/AnalisiEconomica.tsx`) | Analisi | Mezzo-centrico | `storage/@mezzi_aziendali`, `storage/@costiMezzo`, `@documenti_*`, `@analisi_economica_mezzi` | si | si | si | si | si | Analisi costi e anomalie |
| GommeEconomiaSection (`src/pages/GommeEconomiaSection.tsx`) | Analisi | Mezzo-centrico | `storage/@manutenzioni` | si | no | si | no | no | Submodulo analitico gomme |
| RifornimentiEconomiaSection (`src/pages/RifornimentiEconomiaSection.tsx`) | Analisi | Mezzo-centrico | `storage/@rifornimenti`, `storage/@rifornimenti_autisti_tmp` | si | no | si | no | no | Submodulo analitico rifornimenti |
| AutistiGate (`src/autisti/AutistiGate.tsx`) | Autisti | Ibrido | `@autisti_sessione_attive`, `@controlli_mezzo_autisti` | parziale | no | si | no | no | Guard routing autisti |
| LoginAutista (`src/autisti/LoginAutista.tsx`) | Autisti | Globale | `@colleghi`, `@storico_eventi_operativi` | no | si | si | no | no | Login badge |
| SetupMezzo (`src/autisti/SetupMezzo.tsx`) | Autisti | Mezzo-centrico | `@mezzi_aziendali`, `@autisti_sessione_attive`, `@storico_eventi_operativi` | si | si | si | no | no | Associazione mezzo attivo |
| HomeAutista (`src/autisti/HomeAutista.tsx`) | Autisti | Mezzo-centrico | `@autisti_sessione_attive`, `@storico_eventi_operativi` | si | si | si | no | no | Dashboard operativa autista |
| CambioMezzoAutista (`src/autisti/CambioMezzoAutista.tsx`) | Autisti | Mezzo-centrico | `@autisti_sessione_attive`, `@storico_eventi_operativi` | si | si | si | no | no | Cambio assetto |
| Rifornimento (`src/autisti/Rifornimento.tsx`) | Autisti | Mezzo-centrico | `@rifornimenti_autisti_tmp`, `storage/@rifornimenti` | si | si | si | no | no | Scrittura rifornimento |
| ControlloMezzo (`src/autisti/ControlloMezzo.tsx`) | Autisti | Mezzo-centrico | `@controlli_mezzo_autisti` | si | si | si | no | no | Checklist KO/OK |
| Segnalazioni (`src/autisti/Segnalazioni.tsx`) | Autisti | Mezzo-centrico | `@segnalazioni_autisti_tmp`, `@mezzi_aziendali` + Storage foto | si | si | si | no | no | Segnalazioni operative |
| RichiestaAttrezzature (`src/autisti/RichiestaAttrezzature.tsx`) | Autisti | Mezzo-centrico | `@richieste_attrezzature_autisti_tmp` + Storage foto | si | si | si | no | no | Richieste attrezzature |
| AutistiInboxHome (`src/autistiInbox/AutistiInboxHome.tsx`) | Autisti | Ibrido | `homeEvents` (`@storico_eventi_operativi` + chiavi autisti) | parziale | no | si | no | parziale | Hub inbox admin |
| CambioMezzoInbox (`src/autistiInbox/CambioMezzoInbox.tsx`) | Autisti | Mezzo-centrico | `homeEvents` (`@storico_eventi_operativi`) | si | no | si | no | no | Storico cambi mezzo |
| AutistiControlliAll (`src/autistiInbox/AutistiControlliAll.tsx`) | Autisti | Mezzo-centrico | `@controlli_mezzo_autisti` | si | no | si | no | si | Lista controlli |
| AutistiSegnalazioniAll (`src/autistiInbox/AutistiSegnalazioniAll.tsx`) | Autisti | Mezzo-centrico | `@segnalazioni_autisti_tmp` | si | no | si | no | si | Lista segnalazioni |
| RichiestaAttrezzatureAll (`src/autistiInbox/RichiestaAttrezzatureAll.tsx`) | Autisti | Globale | `@richieste_attrezzature_autisti_tmp` | no | no | si | no | si | Lista richieste |
| AutistiGommeAll (`src/autistiInbox/AutistiGommeAll.tsx`) | Autisti | Mezzo-centrico | `@cambi_gomme_autisti_tmp` | si | no | si | no | no | Lista gomme autisti |
| AutistiLogAccessiAll (`src/autistiInbox/AutistiLogAccessiAll.tsx`) | Autisti | Globale | `@storico_eventi_operativi` | no | no | si | no | no | Log accessi |
| AutistiAdmin (`src/autistiInbox/AutistiAdmin.tsx`) | Autisti | Ibrido | `@autisti_sessione_attive`, `@mezzi_aziendali`, `@colleghi`, `@controlli_mezzo_autisti`, `@rifornimenti_autisti_tmp`, `@rifornimenti`, `@segnalazioni_autisti_tmp`, `@richieste_attrezzature_autisti_tmp`, `@cambi_gomme_autisti_tmp`, `@gomme_eventi`, `@storico_eventi_operativi`, `@lavori` | parziale | si | si | no | si | Centro rettifica/import |
| IAHome (`src/pages/IA/IAHome.tsx`) | IA | Globale | `@impostazioni_app/gemini` | no | no | si | si | no | Hub IA |
| IAApiKey (`src/pages/IA/IAApiKey.tsx`) | IA | Globale | `@impostazioni_app/gemini` | no | si | si | si | no | Config chiave |
| IALibretto (`src/pages/IA/IALibretto.tsx`) | IA | Mezzo-centrico | `@impostazioni_app/gemini`, `@mezzi_aziendali`, Function `estrazione_libretto` | si | si | si | si | no | OCR/estrazione libretto |
| IADocumenti (`src/pages/IA/IADocumenti.tsx`) | IA | Ibrido | `@impostazioni_app/gemini`, `@documenti_mezzi`, `@documenti_magazzino`, `@documenti_generici`, `@inventario`, `@mezzi_aziendali` | parziale | si | si | si | no | Estrazione documentale |
| IACoperturaLibretti (`src/pages/IA/IACoperturaLibretti.tsx`) | IA | Mezzo-centrico | `@mezzi_aziendali`, `storage/@mezzi_aziendali` | si | si | si | parziale | no | Audit copertura mezzi |
| ControlloDebug (`src/pages/IA/ControlloDebug.tsx`) | IA | Mezzo-centrico | props `mezzi[]` (read-only) | si | no | si | no | no | Audit anomalie locale |
| LibrettiExport (`src/pages/LibrettiExport.tsx`) | IA | Mezzo-centrico | `@mezzi_aziendali` | si | no | si | parziale | si | Export PDF libretti |
| CisternaCaravatePage (`src/pages/CisternaCaravate/CisternaCaravatePage.tsx`) | IA | Ibrido | `@documenti_cisterna`, `@cisterna_schede_ia`, `@cisterna_parametri_mensili` | parziale | si | si | si | no | Dashboard cisterna |
| CisternaCaravateIA (`src/pages/CisternaCaravate/CisternaCaravateIA.tsx`) | IA | Ibrido | `@documenti_cisterna`, Functions cisterna | parziale | si | si | si | no | Upload/estrazione cisterna |
| CisternaSchedeTest (`src/pages/CisternaCaravate/CisternaSchedeTest.tsx`) | IA | Ibrido | `@cisterna_schede_ia`, `@cisterna_parametri_mensili` | parziale | si | si | si | no | **DA VERIFICARE**: perimetro test vs produzione |
| PdfPreviewModal (`src/components/PdfPreviewModal.tsx`) | Sistema / Supporto | Globale | props blob/url | no | no | si | no | si | Modal standard preview |
| TargaPicker (`src/components/TargaPicker.tsx`) | Sistema / Supporto | Ibrido | props + lookup targhe | parziale | no | si | no | no | Selettore riusabile |
| ModalGomme (`src/pages/ModalGomme.tsx`) | Sistema / Supporto | Mezzo-centrico | dati gomme/manutenzioni (via caller) | si | no | si | no | no | Form gomme condiviso |
| AutistiEventoModal (`src/components/AutistiEventoModal.tsx`) | Sistema / Supporto | Ibrido | molte chiavi autisti/lavori/manutenzioni + preview PDF | parziale | si | si | no | si | Editor/import eventi |
| AutistiImportantEventsModal (`src/components/AutistiImportantEventsModal.tsx`) | Sistema / Supporto | Ibrido | props eventi | parziale | no | si | no | no | Modal alert autisti |
| SessioniAttiveCard (`src/autistiInbox/components/SessioniAttiveCard.tsx`) | Sistema / Supporto | Globale | props sessioni | no | no | si | no | no | Widget inbox |
| RifornimentiCard (`src/autistiInbox/components/RifornimentiCard.tsx`) | Sistema / Supporto | Ibrido | props rifornimenti | parziale | no | si | no | no | Widget inbox |
| storageSync (`src/utils/storageSync.ts`) | Sistema / Supporto | Globale | Firestore `storage/<key>` | no | si | si | no | no | Layer sync (merge-safe mezzi) |
| homeEvents (`src/utils/homeEvents.ts`) | Sistema / Supporto | Ibrido | chiavi autisti aggregate + `autisti_eventi` | parziale | no | si | no | no | Aggregatore timeline autisti |
| pdfEngine (`src/utils/pdfEngine.ts`) | Sistema / Supporto | Globale | input moduli + Storage immagini | no | no | si | parziale | si | Motore PDF centralizzato |
| pdfPreview (`src/utils/pdfPreview.ts`) | Sistema / Supporto | Globale | Blob/URL browser | no | no | si | no | si | Anteprima/condivisione |
| aiCore (`src/utils/aiCore.ts`) | Sistema / Supporto | Globale | Cloud Function callable `aiCore` | no | no | si | si | parziale | Client IA trasversale |
| alertsState (`src/utils/alertsState.ts`) | Sistema / Supporto | Globale | stato alert serializzato | no | si | si | no | no | Stato ack/snooze alert |
| cisterna collections (`src/cisterna/collections.ts`) | Sistema / Supporto | Ibrido | `@documenti_cisterna`, `@cisterna_schede_ia`, `@cisterna_parametri_mensili`, `@rifornimenti_autisti_tmp`, `@mezzi_aziendali`, `@colleghi` | parziale | no | si | parziale | no | Normalizzazione dominio cisterna |
| firebase config (`src/firebase.ts`) | Sistema / Supporto | Globale | Config Firebase app/auth/db/storage/functions | no | no | si | no | no | Bootstrap infrastruttura |
| Functions entry (`functions/index.js`) | Sistema / Supporto | Globale | Firestore `@impostazioni_app/gemini`, Storage, Gemini API | no | si | si | si | parziale | Export estrazione/AI/stamp PDF |
| Functions estrazioneDocumenti (`functions/estrazioneDocumenti.js`) | Sistema / Supporto | Globale | Firestore API key + Gemini | no | no | si | si | no | Estrazione PDF documenti |
| Functions analisiEconomica (`functions/analisiEconomica.js`) | Sistema / Supporto | Mezzo-centrico | Firestore API key + Gemini + payload documenti mezzo | si | no | si | si | no | Analisi AI per targa |
| Functions iaCisternaExtract (`functions/iaCisternaExtract.js`) | Sistema / Supporto | Ibrido | Firestore API key + Gemini | parziale | no | si | si | no | Estrazione IA cisterna |
| Functions-schede entry (`functions-schede/index.js`) | Sistema / Supporto | Ibrido | Endpoint HTTP cisterna | parziale | no | si | si | no | **DA VERIFICARE**: pipeline separata cisterna |
| Functions-schede estrazioneScheda (`functions-schede/estrazioneSchedaCisterna.js`) | Sistema / Supporto | Ibrido | Firestore API key + Gemini pro | parziale | no | si | si | no | **DA VERIFICARE**: stato deploy e ownership |
| Functions-schede documenti (`functions-schede/cisternaDocumentiExtract.js`) | Sistema / Supporto | Ibrido | Firestore API key + Gemini pro | parziale | no | si | si | no | **DA VERIFICARE**: stato deploy e ownership |
| API Vercel pdf-ai-enhance (`api/pdf-ai-enhance.ts`) | Sistema / Supporto | Globale | OpenAI API (`OPENAI_API_KEY`) | no | no | si | si | no | **DA VERIFICARE uso reale in frontend** |
| Route alias dossier (`/dossiermezzi/:targa` e `/dossier/:targa`) | Sistema / Supporto | Mezzo-centrico | Router React | si | no | si | no | no | Alias attivo duplicato |
| Route alias acquisti dettaglio (`/acquisti/dettaglio/:ordineId`) | Sistema / Supporto | Globale | Router React | no | no | si | no | no | **DA VERIFICARE**: punta a `Acquisti`, non a `DettaglioOrdine` |
| Backup file (`src/autistiInbox/AutistiInboxHome.tsx.bak2`) | Sistema / Supporto | Globale | N/A | no | no | no | no | no | Legacy/ambiguo |
| Artefatto zip (`src/main.zip`) | Sistema / Supporto | Globale | N/A | no | no | no | no | no | Legacy/ambiguo |
| Root stub (`rcautistiSetupMezzo.tsx`) | Sistema / Supporto | Globale | N/A | no | no | no | no | no | Legacy/ambiguo |
