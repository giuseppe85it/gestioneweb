# Backlog riorganizzazione hub e Home

## Moduli / famiglie da spostare in Gestione Operativa
- Magazzino e materiali
- Acquisti / Ordini / Materiali da ordinare
- Manutenzioni
- Lavori

## Moduli / famiglie da togliere dalla Home
- Gestione Operativa come famiglia visibile piena
- child procurement (`Materiali da ordinare`, `Ordini in attesa`, `Ordini arrivati`, `Dettaglio ordine`)
- Dossier / Mezzi come ingressi Home diretti
- Cisterna
- Anagrafiche
- Area capo / costi / analisi
- Centro rettifica dati come shortcut Home primaria

## Moduli / famiglie da lasciare in Navigazione rapida
- Gestione Operativa come parent
- Dossier / Mezzi
- Autisti / Autisti Inbox / Admin
- IA / IA interna / IA Libretto / IA Documenti
- Anagrafiche
- Cisterna
- Area capo / costi / analisi

## Doppioni da eliminare
- `Home / Dashboard` vs `Centro di Controllo` come doppio cockpit
- `Mezzi` vs `Dossier lista`
- `Acquisti / Procurement` vs `Materiali da ordinare` come parent + child esposti allo stesso livello
- `Dettaglio ordine` con doppio ingresso
- `Dossier mezzo` con doppio alias route
- `Gestione Operativa` vs alias `operativita-globale`
- `IA hub` vs alias `ia-gestionale`
- `Autisti Gate` vs alias `/next/autista`

## Punti DA DECIDERE
- se `Home` e `Centro di Controllo` debbano restare due ingressi distinti o convergere
- se `Manutenzioni` debba avere anche una presenza sintetica fissa in Home oltre agli alert
- se `Autisti / Inbox / Admin` debba comparire in `Navigazione rapida` come una sola voce parent o con due ingressi distinti
- se `Area capo / costi / analisi` debba restare in `Navigazione rapida` o scendere a solo ricerca/menu
