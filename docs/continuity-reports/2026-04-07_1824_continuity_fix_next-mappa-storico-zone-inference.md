# Continuity Report - 2026-04-07 18:24

## Stato iniziale
- L'inferenza zona della vista `Mappa storico` assegnava alcune manutenzioni gomme/assi anche a zone non coerenti.
- Il caso reale piu evidente era l'associazione errata di interventi su pneumatici o assale anteriore alla zona `Fanali anteriori`.
- La causa nasceva da:
  - keyword troppo generiche nelle aree;
  - fallback non pesato basato su match testuali troppo permissivi.

## Stato finale
- L'inferenza zona da priorita ai componenti specifici `gomme`, `pneumatici`, `ruote`, `asse`, `assale`.
- Le direzioni `fronte`, `sinistra`, `destra`, `retro` vengono applicate solo dopo avere riconosciuto il componente.
- Se il testo indica il componente ma non consente una direzione affidabile, la vista non assegna una zona automatica.
- I match generici restano solo come fallback prudente e non fanno piu vincere `Fanali anteriori` su interventi pneumatici/assali.

## Vincoli preservati
- nessuna modifica a writer business o shape dati;
- nessuna modifica UI generale del modulo;
- nessuna modifica a route o barrier clone;
- intervento limitato a `nextMappaStoricoDomain.ts`, `mezziHotspotAreas.ts` e documentazione.

## Da ricordare nei prossimi passaggi
1. Eventuali nuove keyword devono restare specifiche e non reintrodurre termini generici come `anteriore` da soli.
2. Nei casi ambigui e preferibile `Zona non deducibile` rispetto a una zona sbagliata.
3. Se emergono nuovi componenti tecnici, la precedenza va definita prima nel ramo di match prioritario e solo dopo nel fallback generale.
