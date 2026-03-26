import { useEffect, useState } from "react";
import {
  readNextAutistiReadOnlySnapshot,
  type NextAutistiReadOnlySnapshot,
} from "./domain/nextAutistiDomain";
import {
  readNextMagazzinoRealeSnapshot,
  type NextMagazzinoRealeSnapshot,
} from "./domain/nextMaterialiMovimentiDomain";
import NextOperativitaGlobalePage from "./NextOperativitaGlobalePage";

export default function NextGestioneOperativaPage() {
  const [autistiSnapshot, setAutistiSnapshot] = useState<NextAutistiReadOnlySnapshot | null>(
    null,
  );
  const [magazzinoSnapshot, setMagazzinoSnapshot] = useState<NextMagazzinoRealeSnapshot | null>(
    null,
  );

  useEffect(() => {
    let active = true;

    void Promise.all([
      readNextAutistiReadOnlySnapshot(),
      readNextMagazzinoRealeSnapshot(),
    ]).then(([autisti, magazzino]) => {
      if (!active) {
        return;
      }
      setAutistiSnapshot(autisti);
      setMagazzinoSnapshot(magazzino);
    });

    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <div
        style={{
          margin: "0 0 12px",
          padding: "12px 16px",
          borderRadius: 12,
          border: "1px solid #fed7aa",
          background: "#fff7ed",
          color: "#9a3412",
          fontSize: 14,
        }}
      >
        <strong>D03 autisti in sola lettura.</strong>{" "}
        {autistiSnapshot
          ? `Sessioni madre ${autistiSnapshot.counts.activeSessions}, segnali madre ${autistiSnapshot.counts.attentionSignalsMother}, locali clone ${autistiSnapshot.counts.attentionSignalsLocal}.`
          : "Caricamento confine autisti..."}{" "}
        Nessuna scrittura o sincronizzazione viene eseguita dal clone NEXT.
      </div>
      <div
        style={{
          margin: "0 0 12px",
          padding: "12px 16px",
          borderRadius: 12,
          border: "1px solid #d6d3d1",
          background: "#fafaf9",
          color: "#44403c",
          fontSize: 14,
        }}
      >
        <strong>D05 magazzino in sola lettura.</strong>{" "}
        {magazzinoSnapshot
          ? `Inventario ${magazzinoSnapshot.counts.inventoryItems}, stock critico ${magazzinoSnapshot.counts.inventoryCritical}, movimenti materiali ${magazzinoSnapshot.counts.materialMovements}, attrezzature ${magazzinoSnapshot.counts.attrezzatureMovements}.`
          : "Caricamento confine magazzino..."}{" "}
        Nessun carico, scarico, consegna o variazione stock viene eseguita dal clone NEXT.
      </div>
      <NextOperativitaGlobalePage />
    </>
  );
}
