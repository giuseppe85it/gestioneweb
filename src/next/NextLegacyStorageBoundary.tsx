import { useEffect, useMemo, useState, type ReactNode } from "react";
import { readNextAnagraficheFlottaSnapshot } from "./nextAnagraficheFlottaDomain";
import {
  readNextInventarioSnapshot,
  type NextInventarioReadOnlyItem,
} from "./domain/nextInventarioDomain";
import {
  readNextMaterialiMovimentiSnapshot,
  type NextMaterialeMovimentoReadOnlyItem,
} from "./domain/nextMaterialiMovimentiDomain";
import {
  readNextAttrezzatureCantieriSnapshot,
  type NextAttrezzaturaMovimentoReadOnlyItem,
} from "./domain/nextAttrezzatureCantieriDomain";
import {
  readNextProcurementSnapshot,
  type NextProcurementMaterialItem,
  type NextProcurementOrderItem,
} from "./domain/nextProcurementDomain";
import { readNextLavoriLegacyDataset } from "./domain/nextLavoriDomain";
import { readNextManutenzioniLegacyDataset } from "./domain/nextManutenzioniDomain";
import { pushNextLegacyStorageOverrides } from "./nextLegacyStorageOverlay";
import { readNextAutistiLegacyStorageOverrides } from "./nextLegacyAutistiOverlay";

export type NextLegacyStoragePreset =
  | "flotta"
  | "inventario"
  | "materiali-movimenti"
  | "attrezzature"
  | "procurement"
  | "manutenzioni"
  | "lavori"
  | "autisti";

type NextLegacyStorageBoundaryProps = {
  presets: NextLegacyStoragePreset[];
  children: ReactNode;
  fallback?: ReactNode;
};

function isOfficialNextAutistiPath(pathname: string | undefined | null) {
  const value = String(pathname ?? "").trim();
  return (
    value === "/next/autisti" ||
    value.startsWith("/next/autisti/") ||
    value === "/next/autisti-inbox" ||
    value.startsWith("/next/autisti-inbox/") ||
    value === "/next/autisti-admin" ||
    value.startsWith("/next/autisti-admin/")
  );
}

function toLegacyMezzoRecord(item: Awaited<
  ReturnType<typeof readNextAnagraficheFlottaSnapshot>
>["items"][number]) {
  return {
    id: item.id,
    tipo: item.tipo ?? undefined,
    categoria: item.categoria,
    targa: item.targa,
    anno: item.anno,
    marca: item.marca,
    modello: item.modello,
    marcaModello: item.marcaModello,
    telaio: item.telaio,
    colore: item.colore,
    cilindrata: item.cilindrata,
    potenza: item.potenza,
    massaComplessiva: item.massaComplessiva,
    proprietario: item.proprietario,
    assicurazione: item.assicurazione,
    dataImmatricolazione: item.dataImmatricolazione,
    dataScadenzaRevisione: item.dataScadenzaRevisione,
    dataUltimoCollaudo: item.dataUltimoCollaudo,
    manutenzioneProgrammata: item.manutenzioneProgrammata,
    manutenzioneDataInizio: item.manutenzioneDataInizio,
    manutenzioneDataFine: item.manutenzioneDataFine,
    manutenzioneKmMax: item.manutenzioneKmMax,
    manutenzioneContratto: item.manutenzioneContratto,
    note: item.note,
    autistaId: item.autistaId,
    autistaNome: item.autistaNome,
    fotoUrl: item.fotoUrl,
    fotoPath: item.fotoPath,
    fotoStoragePath: item.fotoStoragePath,
    librettoUrl: item.librettoUrl,
  };
}

function toLegacyCollegaRecord(item: Awaited<
  ReturnType<typeof readNextAnagraficheFlottaSnapshot>
>["colleghi"][number]) {
  return {
    id: item.id,
    nome: item.nome,
    cognome: item.cognome,
    badge: item.badge,
    codice: item.codice,
    descrizione: item.descrizione,
  };
}

function toLegacyInventarioRecord(item: NextInventarioReadOnlyItem) {
  return {
    id: item.id,
    descrizione: item.descrizione,
    quantita: item.quantita ?? 0,
    unita: item.unita ?? "pz",
    fornitore: item.fornitore,
    fotoUrl: item.fotoUrl,
    fotoStoragePath: item.fotoStoragePath,
  };
}

function toLegacyMaterialeConsegnatoRecord(item: NextMaterialeMovimentoReadOnlyItem) {
  return {
    id: item.id,
    descrizione: item.descrizione ?? item.materiale ?? "",
    quantita: item.quantita ?? 0,
    unita: item.unita ?? "pz",
    destinatario: {
      type: item.destinatario.type ?? "COLLEGA",
      refId: item.destinatario.refId ?? item.targa ?? item.id,
      label: item.destinatario.label ?? item.target ?? item.mezzoTarga ?? "DESTINATARIO",
    },
    motivo: item.motivo ?? "",
    data: item.data ?? "",
    fornitore: item.fornitore ?? null,
  };
}

function toLegacyAttrezzaturaRecord(item: NextAttrezzaturaMovimentoReadOnlyItem) {
  return {
    id: item.id,
    tipo: item.tipo,
    data: item.data ?? "",
    materialeCategoria: item.materialeCategoria ?? "ALTRO",
    descrizione: item.descrizione,
    quantita: item.quantita,
    unita: item.unita,
    cantiereId: item.cantiereId ?? "",
    cantiereLabel: item.cantiereLabel,
    note: item.note,
    fotoUrl: item.fotoUrl,
    fotoStoragePath: item.fotoStoragePath,
    sourceCantiereId: item.sourceCantiereId,
    sourceCantiereLabel: item.sourceCantiereLabel,
  };
}

function toLegacyOrdineMaterial(item: NextProcurementMaterialItem) {
  return {
    id: item.id,
    descrizione: item.descrizione,
    quantita: item.quantita ?? 0,
    unita: item.unita ?? "pz",
    arrivato: item.arrived,
    dataArrivo: item.arrivalDateLabel ?? "",
    fotoUrl: item.photoUrl,
    fotoStoragePath: item.photoStoragePath,
  };
}

function toLegacyOrdineRecord(item: NextProcurementOrderItem) {
  return {
    id: item.id,
    idFornitore: item.supplierId ?? item.supplierName,
    nomeFornitore: item.supplierName,
    dataOrdine: item.orderDateLabel ?? "",
    materiali: item.materials.map(toLegacyOrdineMaterial),
    arrivato: item.state === "arrivato",
  };
}

async function buildOverrides(
  presets: NextLegacyStoragePreset[],
  pathname?: string,
) {
  const overrides: Record<string, unknown> = {};
  const requested = new Set(presets);

  if (requested.has("flotta")) {
    const snapshot = await readNextAnagraficheFlottaSnapshot();
    overrides["@mezzi_aziendali"] = snapshot.items.map(toLegacyMezzoRecord);
    overrides["@colleghi"] = snapshot.colleghi.map(toLegacyCollegaRecord);
  }

  if (requested.has("inventario")) {
    const snapshot = await readNextInventarioSnapshot();
    overrides["@inventario"] = snapshot.items.map(toLegacyInventarioRecord);
  }

  if (requested.has("materiali-movimenti")) {
    const snapshot = await readNextMaterialiMovimentiSnapshot();
    overrides["@materialiconsegnati"] = snapshot.items.map(toLegacyMaterialeConsegnatoRecord);
  }

  if (requested.has("attrezzature")) {
    const snapshot = await readNextAttrezzatureCantieriSnapshot();
    overrides["@attrezzature_cantieri"] = snapshot.items.map(toLegacyAttrezzaturaRecord);
  }

  if (requested.has("procurement")) {
    const snapshot = await readNextProcurementSnapshot();
    overrides["@ordini"] = snapshot.orders.map(toLegacyOrdineRecord);
  }

  if (requested.has("manutenzioni")) {
    overrides["@manutenzioni"] = await readNextManutenzioniLegacyDataset();
  }

  if (requested.has("lavori")) {
    overrides["@lavori"] = await readNextLavoriLegacyDataset();
  }

  if (requested.has("autisti") && !isOfficialNextAutistiPath(pathname)) {
    Object.assign(overrides, await readNextAutistiLegacyStorageOverrides());
  }

  return overrides;
}

export default function NextLegacyStorageBoundary({
  presets,
  children,
  fallback = <div className="next-clone-placeholder">Caricamento layer dati NEXT...</div>,
}: NextLegacyStorageBoundaryProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const presetsKey = useMemo(() => Array.from(new Set(presets)).sort().join("|"), [presets]);
  const stablePresets = useMemo(
    () => (presetsKey ? presetsKey.split("|") : []) as NextLegacyStoragePreset[],
    [presetsKey],
  );

  useEffect(() => {
    let cancelled = false;
    let dispose: (() => void) | null = null;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const overrides = await buildOverrides(
          stablePresets,
          typeof window === "undefined" ? undefined : window.location.pathname,
        );
        if (cancelled) {
          return;
        }
        dispose = pushNextLegacyStorageOverrides(overrides);
      } catch (loadError) {
        if (cancelled) {
          return;
        }
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Impossibile attivare il bridge dati legacy-shaped del clone.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
      dispose?.();
    };
  }, [presetsKey, stablePresets]);

  if (loading) {
    return <>{fallback}</>;
  }

  if (error) {
    return <div className="next-clone-placeholder">{error}</div>;
  }

  return <>{children}</>;
}
