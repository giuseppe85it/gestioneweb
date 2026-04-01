# Matrice Home - Moduli e Decisioni

| Modulo | Ingresso principale consigliato | Ingressi secondari | Oggi in Home? sì/no | Deve restare in Home? sì/no/forse | Frequenza | Urgenza | Duplica altri accessi? sì/no | Decisione proposta | Motivo breve |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home NEXT / Centro di Controllo Home | `/next` | `/next/centro-controllo` | sì | sì | alta | alta | sì | Tenere in Home solo ruolo cockpit | E il punto di ripresa operativo |
| Alert | card Home | Autisti Inbox, Dossier, modali dominio | sì | sì | alta | alta | no | Tenere e proteggere come blocco principale | Porta urgenze vere |
| Stato operativo | card Home | Autisti Inbox, Autisti Admin | sì | sì | alta | alta | sì | Tenere in Home come sintesi, non come modulo pieno | Legge stato giornaliero |
| Navigazione rapida | card Home | menu shell, ricerca | sì | sì | alta | media | sì | Tenere ma minimale | Serve come hub leggero, non come dashboard |
| Gestione Operativa | `/next/gestione-operativa` | Navigazione rapida, menu | storicamente sì | forse | alta | media | sì | Spostare in Navigazione rapida/menu | E un modulo padre, non un alert |
| Dossier Mezzi | `/next/dossiermezzi` e `/next/dossier/:targa` | Mezzi, ricerca, alert | storicamente sì | no | media | media | sì | Togliere dalla Home diretta | Meglio via Mezzi o ricerca targa |
| Mezzi | `/next/mezzi` | Navigazione rapida, ricerca | storicamente sì | forse | alta | media | sì | Lasciare in Navigazione rapida/ricerca | Parent naturale del dossier |
| Autisti Inbox (admin) | `/next/autisti-inbox` | Alert, Stato operativo, menu | storicamente sì | forse | alta | alta | sì | Lasciare come destinazione padre, non blocco Home dedicato | Home deve sintetizzare, Inbox deve lavorare |
| Centro rettifica dati (admin) | `/next/autisti-admin` | Autisti Inbox, menu, ricerca | storicamente sì | no | media | media | sì | Togliere dalla Home primaria | E strumento di correzione specialistico |
| App Autisti | `/next/autisti/*` | Navigazione rapida, menu | storicamente sì | no | alta per autisti | media | sì | Lasciare nel dominio dedicato | Non e accesso primario della Home admin |
| IA interna | `/next/ia/interna*` | launcher Home | sì | sì | media | media | sì | Tenere in Home solo come launcher | Strumento trasversale utile |
| IA hub | `/next/ia` | Navigazione rapida, menu | storicamente sì | no | media | bassa | sì | Spostare in Navigazione rapida/menu | Menu specialistico, non urgente |
| IA Libretto | `/next/ia/libretto` | IA hub, Dossier Mezzo | storicamente sì | no | bassa | bassa | sì | Togliere dalla Home | Tool verticale specialistico |
| Acquisti / Procurement | `/next/acquisti` | Gestione Operativa, Navigazione rapida | storicamente sì | forse | media | media | sì | Lasciare in Navigazione rapida o parent operativo | Parent di un cluster ampio |
| Materiali da ordinare | `/next/materiali-da-ordinare` | Acquisti, Navigazione rapida | storicamente sì | no | media | media | sì | Tenere sotto Procurement | Child, non ingresso Home |
| Manutenzioni | `/next/manutenzioni` | Gestione Operativa, Dossier, ricerca | storicamente sì | forse | media | alta | sì | Tenere in Navigazione rapida e alert futuri | Importante ma non Home fissa |
| Cisterna | `/next/cisterna` | Navigazione rapida, IA hub | storicamente sì | no | rara ma critica | media | sì | Lasciare in menu/ricerca/Navigazione rapida | Dominio verticale specialistico |
