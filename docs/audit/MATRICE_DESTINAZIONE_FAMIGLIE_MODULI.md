# Matrice destinazione famiglie moduli

| Famiglia | Tipo | Moduli inclusi | Ingresso principale consigliato | Home | Gestione Operativa | Navigazione rapida | Solo modulo padre/ricerca | Decisione finale | Motivo breve |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Centro di controllo / Home / Dashboard | controllo | Home / Dashboard, Centro di Controllo | Home / Dashboard | sì | no | no | no | Restare in Home | E il cockpit di priorita, non un child operativo |
| Magazzino e materiali | operativo | Inventario, Materiali consegnati, Attrezzature cantieri | Gestione Operativa | no | sì | sì | no | Mettere in Gestione Operativa | Famiglia operativa quotidiana |
| Acquisti / Ordini / Materiali da ordinare | operativo | Acquisti, Materiali da ordinare, Ordini in attesa, Ordini arrivati, Dettaglio ordine | Gestione Operativa | no | sì | sì | no | Mettere in Gestione Operativa | Parent naturale del procurement operativo |
| Manutenzioni | operativo | Manutenzioni | Gestione Operativa | forse | sì | sì | no | Mettere in Gestione Operativa | Connessa a materiali, lavori e disponibilita mezzi |
| Lavori | operativo | Lavori da eseguire, Lavori in attesa, Lavori eseguiti, Dettaglio lavoro | Gestione Operativa | no | sì | sì | no | Mettere in Gestione Operativa | Famiglia di esecuzione pura |
| Cisterna | operativo | Cisterna, Cisterna IA, Cisterna Schede Test | Cisterna | no | no | sì | sì | Lasciare fuori | Verticale specialistico con hub proprio |
| Dossier / Mezzi | anagrafica | Mezzi, Dossier lista, Dossier mezzo, Dossier gomme, Dossier rifornimenti | Mezzi o Dossier lista | no | no | sì | sì | Lasciare fuori | Famiglia mezzo-centrica con parent proprio |
| Autisti / Autisti Inbox / Admin | operativo | Autisti, Inbox, Admin e child | Autisti Inbox Home per admin; Autisti Gate per autisti | forse | no | sì | sì | Lasciare fuori | Ecosistema event-driven con hub proprio |
| IA / IA interna / IA Libretto / IA Documenti | trasversale | IA hub, IA interna e strumenti IA | IA interna per launcher; IA hub per specialistici | sì | no | sì | sì | Lasciare fuori | Famiglia trasversale, non operativa in senso stretto |
| Anagrafiche | anagrafica | Colleghi, Fornitori | Menu/modulo anagrafica | no | no | sì | sì | Lasciare fuori | Supporto dati, non esecuzione operativa |
| Area capo / costi / analisi | analisi | Capo mezzi, Capo costi mezzo, Analisi economica | Capo mezzi o Dossier | no | no | forse | sì | Lasciare fuori | Famiglia di analisi e controllo specialistico |
| Supporti tecnici / alias | supporto | Shell, layout, redirect, fallback | nessuno | no | no | no | sì | Tenere fuori da ingressi utente | Non e famiglia funzionale utente |
