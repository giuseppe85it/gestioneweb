# Continuity Report - Demo TyreVehicleView

## Stato

La demo tecnica della visualizzazione gomme dinamica e' disponibile su:

`/next/dev/gomme-demo`

La pagina e' marcata come:

`DEMO TECNICA - NON MODULO`

## Scopo

Validare prima dell'integrazione reale l'effetto approvato:

- base camion neutra;
- pneumatico colorato dinamicamente;
- rosso per gomma sostituita;
- nero/grigio scuro per altre gomme;
- cerchione visibile;
- nessun PNG fisso rosso;
- nessun pallino/marker/mezzaluna.

## Vincoli mantenuti

- Nessun dato business letto o scritto.
- Nessuna integrazione in `NextMappaStoricoPage`.
- Nessun writer/domain/barrier toccato.
- Nessuna modifica agli asset `public/gomme/*`.

## Prossimo passo

Usare la demo per approvazione visiva. Solo dopo approvazione, aprire una execution separata per integrare il componente nel Dettaglio Manutenzioni gomme.

## Aggiornamento 2026-06-09 - Prompt 2A

La demo e' stata corretta dopo bocciatura visiva:

- `Preview approvazione effetto` e' la sezione principale da mostrare a Giuseppe.
- La preview mostra un solo camion grande, una gomma rossa e le altre gomme scure.
- Le geometrie sono maschere SVG piene con foro centrale, non cerchi-marker.
- Le gemellate restano due pneumatici separati.

Restano fuori perimetro:

- integrazione in `NextMappaStoricoPage`;
- lettura/scrittura Firestore;
- modifiche a domain, writer o barrier;
- modifiche agli asset immagine.

## Aggiornamento 2026-06-09 - Prompt 2B

La demo non usa piu' maschere/anelli per colorare il PNG.

Stato corrente:

- `TyreVehicleView` contiene `VectorTyreWheel`, ruota SVG completa sopra il PNG.
- Ogni ruota ha pneumatico pieno colorato, cerchione chiaro, mozzo e bulloni.
- `replaced` = pneumatico rosso.
- `default` = pneumatico grigio/nero scuro.
- `neutral` = nessuna ruota ridisegnata.
- `Preview approvazione effetto` resta la sezione principale da validare.

Il prossimo passo resta approvazione visiva della demo prima di qualunque integrazione nel Dettaglio Manutenzioni gomme.

## Aggiornamento 2026-06-09 - Maschere da reference

La demo corrente usa maschere estratte dalla reference approvata.

Stato corrente:

- La base e' `public/gomme/trattore_cisternaDX.png`.
- La reference e' `docs/mockups/gomme-assets/camion_reference_gomme_colorate.png`.
- Lo script `scripts/extract-gomme-reference-masks.mjs` genera le maschere full-size.
- Le maschere disponibili sono `mask_front_right.png` e `mask_rear_right_outer.png`.
- `TyreVehicleView` non disegna cerchi, ellissi o ruote nuove: colora rettangoli solo attraverso le maschere.

Il prossimo passo resta solo approvazione visiva della preview principale. L'integrazione nel Dettaglio Manutenzioni gomme resta fuori perimetro.

## Aggiornamento 2026-06-09 - Pacchetto completo DX

Il pacchetto maschere del `trattore_cisternaDX.png` contiene ora:

- `mask_front_right.png`
- `mask_rear_right_outer.png`
- `mask_rear_right_inner.png`

La demo `/next/dev/gomme-demo` include tutte e tre le maschere. Il metodo resta quello approvato: base neutra, colore dinamico da stato e nessuna ruota ridisegnata.

## Aggiornamento 2026-06-09 - Combinazioni reali DX

La demo ora copre:

- straordinario anteriore destra;
- straordinario posteriore destra esterna;
- straordinario posteriore destra interna;
- coppia gemellata destra;
- ordinario asse anteriore con stato logico DX+SX;
- ordinario asse posteriore con stato logico DX+SX;
- ordinario completo;
- dato incompleto posteriore quantita' 1 senza posizione, senza colorare gomme inventate.

La futura vista SX dovra' usare gli stessi stati logici per mostrare `front_left`, `rear_left_outer`, `rear_left_inner`.

## Aggiornamento 2026-06-09 - Recovery visuale DX

La demo e' organizzata cosi':

1. preview approvazione effetto;
2. debug maschera anteriore destra;
3. debug maschera posteriore destra esterna;
4. debug maschera posteriore destra interna;
5. coppia gemellata destra;
6. ordinario asse anteriore;
7. ordinario asse posteriore;
8. ordinario completo;
9. dato incompleto senza posizione.

Nei debug singoli le gomme non coinvolte sono `neutral`, cosi' la maschera verificata non viene confusa da gomme scure.

## Aggiornamento 2026-06-09 - Pipeline reference DX

Stato attuale della demo gomme dinamiche:

- modello coperto: `trattore_cisternaDX`;
- vista coperta: DX;
- gomme visibili: `front_right`, `rear_right_outer`, `rear_right_inner`;
- gomme logiche future SX mantenute solo nella mappa di stato: `front_left`, `rear_left_outer`, `rear_left_inner`.

Pipeline ripetibile:

1. eseguire `node scripts/generate-trattore-cisterna-dx-references.mjs`;
2. eseguire `node scripts/build-tyre-masks-from-reference.mjs`;
3. verificare `/next/dev/gomme-demo`.

La demo non integra ancora il Dettaglio Manutenzioni e non legge/scrive dati business.
