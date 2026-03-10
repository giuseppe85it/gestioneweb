import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  NEXT_AREA_ACCESS,
  NEXT_ROLE_PRESETS,
  buildNextPathWithRole,
  getNextRoleFromSearch,
} from "./nextAccess";
import { NEXT_AREAS } from "./nextData";
import { normalizeNextMezzoTarga, type NextMezzoListItem } from "./nextAnagraficheFlottaDomain";
import {
  type NextMaintenanceHistoryItem,
  type NextManutenzioneQuality,
  type NextScheduledMaintenance,
  type NextScheduledMaintenanceStatus,
} from "./domain/nextManutenzioniDomain";
import {
  type NextDossierMezzoCompositeSnapshot,
  readNextDossierMezzoCompositeSnapshot,
} from "./domain/nextDossierMezzoDomain";
import {
  type NextMezzoRifornimentiSnapshot,
  type NextRifornimentoFieldQuality,
  type NextRifornimentoMatchStrategy,
  type NextRifornimentoProvenienza,
  type NextRifornimentoReadOnlyItem,
} from "./nextRifornimentiConsumiDomain";
import {
  type NextDocumentiCostiCurrency,
  type NextDocumentiCostiReadOnlyItem,
  type NextMezzoDocumentiCostiSnapshot,
} from "./domain/nextDocumentiCostiDomain";

const INTEGER_FORMATTER = new Intl.NumberFormat("it-IT", {
  maximumFractionDigits: 0,
});

const LITERS_FORMATTER = new Intl.NumberFormat("it-IT", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

const CURRENCY_FORMATTER = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const CHF_CURRENCY_FORMATTER = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "CHF",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const DECIMAL_FORMATTER = new Intl.NumberFormat("it-IT", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function renderMarcaModello(item: NextMezzoListItem) {
  const value = [item.marca, item.modello].filter(Boolean).join(" ");
  return value || "Marca / modello non valorizzati";
}

function renderOptionalLabel(
  value: string | null,
  fallback: string = "Dato non valorizzato"
) {
  return value || fallback;
}

function formatIntegerValue(value: number | null): string {
  return value === null ? "--" : INTEGER_FORMATTER.format(value);
}

function formatLitriValue(value: number | null): string {
  return value === null ? "--" : LITERS_FORMATTER.format(value);
}

function formatCurrencyValue(value: number | null): string {
  return value === null ? "--" : CURRENCY_FORMATTER.format(value);
}

function formatDocumentAmountValue(
  value: number | null,
  currency: NextDocumentiCostiCurrency
): string {
  if (value === null) return "--";
  if (currency === "CHF") return CHF_CURRENCY_FORMATTER.format(value);
  if (currency === "EUR") return CURRENCY_FORMATTER.format(value);
  return `${DECIMAL_FORMATTER.format(value)} (valuta da verificare)`;
}

function renderLavoroMeta(item: { dataInserimento: string | null }) {
  return item.dataInserimento
    ? `Inserito ${item.dataInserimento}`
    : "Lavoro tecnico senza data inserimento valorizzata.";
}

function renderRefuelStatusLabel(
  status: "idle" | "loading" | "success" | "error",
  snapshot: NextMezzoRifornimentiSnapshot | null
) {
  switch (status) {
    case "loading":
      return "Caricamento D04";
    case "success":
      if (!snapshot) return "In attesa";
      if (snapshot.counts.total > 0) return "Ricostruzione controllata attiva";
      if (
        snapshot.datasetShapes.business === "missing" &&
        snapshot.datasetShapes.field === "missing"
      ) {
        return "Dataset D04 assenti";
      }
      if (
        snapshot.datasetShapes.business === "unsupported" &&
        snapshot.datasetShapes.field === "unsupported"
      ) {
        return "Dataset D04 non conformi";
      }
      return "Nessun rifornimento per mezzo";
    case "error":
      return "Reader D04 in errore";
    default:
      return "In attesa";
  }
}

function renderDocumentCostStatusLabel(
  status: "idle" | "loading" | "success" | "error",
  snapshot: NextMezzoDocumentiCostiSnapshot | null
) {
  switch (status) {
    case "loading":
      return "Caricamento D07/D08";
    case "success":
      if (!snapshot) return "In attesa";
      if (snapshot.counts.total > 0) return "Preview documenti e costi attiva";
      if (snapshot.datasetShapes.costiMezzo === "missing") {
        return "Dataset costi assente";
      }
      if (snapshot.datasetShapes.costiMezzo === "unsupported") {
        return "Dataset costi non conforme";
      }
      return "Nessun documento o costo per mezzo";
    case "error":
      return "Reader D07/D08 in errore";
    default:
      return "In attesa";
  }
}

function renderSummaryToneClassName(tone: "accent" | "success" | "warning" | "default") {
  switch (tone) {
    case "accent":
      return "next-summary-card next-tone next-tone--accent";
    case "success":
      return "next-summary-card next-tone next-tone--success";
    case "warning":
      return "next-summary-card next-tone next-tone--warning";
    default:
      return "next-summary-card next-tone";
  }
}

function renderRefuelQualityLabel(value: NextRifornimentoFieldQuality) {
  switch (value) {
    case "certo":
      return "dato certo";
    case "ricostruito":
      return "dato ricostruito";
    default:
      return "non disponibile";
  }
}

function renderRefuelProvenienzaLabel(value: NextRifornimentoProvenienza) {
  switch (value) {
    case "business":
      return "Business";
    case "campo":
      return "Campo";
    default:
      return "Ricostruito";
  }
}

function renderRefuelMatchLabel(value: NextRifornimentoMatchStrategy) {
  switch (value) {
    case "match_origin_id":
      return "Match origin id";
    case "match_euristica_10_minuti":
      return "Match euristico 10 min";
    case "match_euristica_stesso_giorno":
      return "Match euristico giorno";
    case "solo_campo":
      return "Solo feed campo";
    default:
      return "Solo business";
  }
}

function renderRifornimentoMeta(item: NextRifornimentoReadOnlyItem) {
  const parts = [
    item.dataDisplay ? `Data ${item.dataDisplay}` : "Data non disponibile",
    item.litri !== null ? `${formatLitriValue(item.litri)} L` : null,
    item.autistaNome
      ? `Autista ${item.autistaNome}${item.badgeAutista ? ` (${item.badgeAutista})` : ""}`
      : item.badgeAutista
      ? `Badge ${item.badgeAutista}`
      : null,
  ].filter(Boolean);

  return parts.join(" | ");
}

function renderDocumentTotalsSummary(
  totals: NextMezzoDocumentiCostiSnapshot["totals"]["preventivi"] | null
) {
  if (!totals || totals.withAmount === 0) {
    return "Totali prudenziali non disponibili";
  }

  const parts = [];
  if (totals.eur > 0) parts.push(CURRENCY_FORMATTER.format(totals.eur));
  if (totals.chf > 0) parts.push(CHF_CURRENCY_FORMATTER.format(totals.chf));
  if (totals.unknownCount > 0) {
    parts.push(`valuta da verificare: ${formatIntegerValue(totals.unknownCount)}`);
  }

  return parts.join(" | ");
}

function renderDocumentCostMeta(item: NextDocumentiCostiReadOnlyItem) {
  const parts = [
    item.dateLabel ? `Data ${item.dateLabel}` : "Data non disponibile",
    item.supplier ? `Fornitore ${item.supplier}` : null,
    `Origine ${item.sourceLabel}`,
  ].filter(Boolean);

  return parts.join(" | ");
}

function renderDocumentCostReadOnlyCard(item: NextDocumentiCostiReadOnlyItem) {
  return (
    <div key={item.id} className="next-control-list__item">
      <div className="next-global-pillbar">
        <span
          className={
            item.category === "fattura"
              ? "next-chip next-chip--warning"
              : item.category === "preventivo"
              ? "next-chip next-chip--accent"
              : "next-chip next-chip--success"
          }
        >
          {item.documentTypeLabel}
        </span>
        <span className="next-chip next-chip--subtle">{item.sourceLabel}</span>
        <span className="next-chip next-chip--subtle">
          {item.amount !== null
            ? formatDocumentAmountValue(item.amount, item.currency)
            : "importo non disponibile"}
        </span>
      </div>
      <strong>{item.title}</strong>
      <span>{renderDocumentCostMeta(item)}</span>
      <span>
        File: {item.fileUrl ? "presente" : "non disponibile"}
        {" | "}Importo: {item.fieldQuality.amount === "non_disponibile" ? "non leggibile" : item.fieldQuality.amount}
        {" | "}Data: {item.fieldQuality.date === "non_disponibile" ? "non leggibile" : item.fieldQuality.date}
      </span>
    </div>
  );
}

function renderMaintenanceQualityLabel(value: NextManutenzioneQuality) {
  switch (value) {
    case "source_direct":
      return "dato diretto";
    case "derived_acceptable":
      return "dato derivato";
    default:
      return "fuori v1";
  }
}

function renderScheduledMaintenanceStatusLabel(value: NextScheduledMaintenanceStatus) {
  switch (value) {
    case "scaduta":
      return "Scaduta";
    case "in_scadenza":
      return "In scadenza";
    case "pianificata":
      return "Pianificata";
    case "data_mancante":
      return "Data mancante";
    default:
      return "Non attiva";
  }
}

function getScheduledMaintenanceToneClassName(value: NextScheduledMaintenanceStatus) {
  switch (value) {
    case "scaduta":
      return "next-chip next-chip--warning";
    case "in_scadenza":
      return "next-chip next-chip--accent";
    case "pianificata":
      return "next-chip next-chip--success";
    case "data_mancante":
      return "next-chip next-chip--warning";
    default:
      return "next-chip next-chip--subtle";
  }
}

function renderScheduledMaintenanceMeta(item: NextScheduledMaintenance) {
  if (!item.enabled) {
    return "Nessuna pianificazione manutentiva attiva sul mezzo.";
  }

  if (item.daysToDeadline === null) {
    return item.status === "data_mancante"
      ? "La pianificazione e attiva ma non ha una data fine parsabile."
      : "Pianificazione attiva senza scadenza calcolabile.";
  }

  if (item.daysToDeadline < 0) {
    const days = Math.abs(item.daysToDeadline);
    return `Scaduta da ${formatIntegerValue(days)} giorni.`;
  }

  return `Scadenza tra ${formatIntegerValue(item.daysToDeadline)} giorni.`;
}

function renderMaintenanceHistoryMeta(item: NextMaintenanceHistoryItem) {
  const parts = [
    item.dataRaw ? `Data ${item.dataRaw}` : "Data non disponibile",
    item.tipo ? `Tipo ${item.tipo}` : null,
    item.km !== null ? `${formatIntegerValue(item.km)} km` : null,
    item.ore !== null ? `${formatIntegerValue(item.ore)} h` : null,
    item.materialiCount > 0 ? `Materiali ${formatIntegerValue(item.materialiCount)}` : null,
    item.eseguitoLabel ? `Eseguito ${item.eseguitoLabel}` : null,
  ].filter(Boolean);

  return parts.join(" | ");
}

function renderRefuelReadOnlyCard(item: NextRifornimentoReadOnlyItem) {
  return (
    <div key={item.id} className="next-control-list__item">
      <div className="next-global-pillbar">
        <span className="next-chip next-chip--success">
          {renderRefuelProvenienzaLabel(item.provenienza)}
        </span>
        <span className="next-chip next-chip--accent">
          {item.dataDisplay ?? "Data non disponibile"}
        </span>
        <span className="next-chip next-chip--subtle">
          {item.litri !== null ? `${formatLitriValue(item.litri)} L` : "Litri non disponibili"}
        </span>
        <span className="next-chip next-chip--subtle">
          {item.km !== null ? `${formatIntegerValue(item.km)} km` : "km non disponibile"}
        </span>
        <span className="next-chip next-chip--subtle">
          {item.costo !== null ? formatCurrencyValue(item.costo) : "costo non disponibile"}
        </span>
        <span className="next-chip next-chip--subtle">
          {renderRefuelMatchLabel(item.matchStrategy)}
        </span>
      </div>
      <strong>{renderOptionalLabel(item.distributore, "Distributore non valorizzato")}</strong>
      <span>{renderRifornimentoMeta(item)}</span>
      <span>{renderOptionalLabel(item.note, "Nessuna nota disponibile nel modello D04.")}</span>
      <span>
        Timestamp:{" "}
        {item.timestampRicostruito !== null
          ? renderRefuelQualityLabel(item.fieldQuality.timestampRicostruito)
          : "non disponibile"}
        {" | "}
        Autista: {renderRefuelQualityLabel(item.fieldQuality.autistaNome)}
        {" | "}
        KM: {renderRefuelQualityLabel(item.fieldQuality.km)}
        {" | "}
        Costo: {renderRefuelQualityLabel(item.fieldQuality.costo)}
      </span>
    </div>
  );
}

function NextDossierMezzoPage() {
  const { targa: routeTarga } = useParams();
  const location = useLocation();
  const role = getNextRoleFromSearch(location.search);
  const area = NEXT_AREAS["mezzi-dossier"];
  const access = NEXT_AREA_ACCESS["mezzi-dossier"];
  const allowedRoleLabels = access.allowedRoles.map((entry) => NEXT_ROLE_PRESETS[entry].label);
  const normalizedTarga = normalizeNextMezzoTarga(routeTarga);

  const [dossierSnapshot, setDossierSnapshot] =
    useState<NextDossierMezzoCompositeSnapshot | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "not-found">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);
  const [showAllMaintenance, setShowAllMaintenance] = useState(false);
  const [showAllRefuels, setShowAllRefuels] = useState(false);

  const listPath = buildNextPathWithRole("/next/mezzi-dossier", role, location.search);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!normalizedTarga) {
        setStatus("error");
        setError("Parametro targa non valido per il Dossier NEXT.");
        setDossierSnapshot(null);
        setShowAllMaintenance(false);
        setShowAllRefuels(false);
        return;
      }

      try {
        setStatus("loading");
        setError(null);
        setDossierSnapshot(null);
        setShowAllMaintenance(false);
        setShowAllRefuels(false);

        const snapshot = await readNextDossierMezzoCompositeSnapshot(normalizedTarga);
        if (!active) return;

        if (!snapshot) {
          setStatus("not-found");
          setError(
            `Il mezzo ${normalizedTarga} non e presente nel dataset canonico di identita mezzo.`
          );
          return;
        }

        setDossierSnapshot(snapshot);
        setStatus("success");
      } catch {
        if (!active) return;

        setStatus("error");
        setError("Impossibile leggere il Dossier NEXT dal layer mezzo-centrico.");
        setDossierSnapshot(null);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [normalizedTarga]);

  const mezzo = dossierSnapshot?.mezzo ?? null;
  const overview = dossierSnapshot?.overview ?? null;
  const technicalState = dossierSnapshot?.technical ?? {
    status: "idle",
    snapshot: null,
    error: null,
  };
  const maintenanceState = dossierSnapshot?.maintenance ?? {
    status: "idle",
    snapshot: null,
    error: null,
  };
  const refuelState = dossierSnapshot?.refuels ?? {
    status: "idle",
    snapshot: null,
    error: null,
  };
  const documentCostsState = dossierSnapshot?.documentCosts ?? {
    status: "idle",
    snapshot: null,
    error: null,
  };

  const technicalSnapshot = technicalState.snapshot;
  const maintenanceSnapshot = maintenanceState.snapshot;
  const refuelSnapshot = refuelState.snapshot;
  const documentCostsSnapshot = documentCostsState.snapshot;

  const lavoriAperti = technicalSnapshot?.lavoriAperti ?? [];
  const lavoriChiusi = technicalSnapshot?.lavoriChiusi ?? [];
  const lavoriApertiPreview = lavoriAperti.slice(0, 3);
  const lavoriChiusiPreview = lavoriChiusi.slice(0, 3);

  const scheduledMaintenance = maintenanceSnapshot?.scheduledMaintenance ?? null;
  const maintenanceHistory = maintenanceSnapshot?.historyItems ?? [];
  const maintenanceHistoryPreview = maintenanceHistory.slice(0, 3);
  const maintenanceCounts = maintenanceSnapshot?.counts ?? null;
  const hasMaintenanceFullView = maintenanceHistory.length > maintenanceHistoryPreview.length;
  const latestMaintenanceDate = maintenanceHistory[0]?.dataRaw ?? null;

  const refuels = refuelSnapshot?.items ?? [];
  const refuelsPreview = refuels.slice(0, 5);
  const hasRefuelFullView = refuels.length > refuelsPreview.length;
  const latestRefuelDate = refuels[0]?.dataDisplay ?? null;
  const preventiviPreview = documentCostsSnapshot?.groups.preventivi.slice(0, 3) ?? [];
  const fatturePreview = documentCostsSnapshot?.groups.fatture.slice(0, 3) ?? [];
  const documentiUtiliPreview = documentCostsSnapshot?.groups.documentiUtili.slice(0, 3) ?? [];
  const dossierStatusItems = [
    "vista unica del mezzo, non somma di mini-import",
    "identita chiara, backlog leggibile, manutenzioni leggibili, rifornimenti leggibili, documenti e costi leggibili",
    "nessun dominio extra importato per riempimento",
    "`Mezzo360` resta target futuro assistito, non pagina da migrare",
  ];
  const primaryHeroCards = [
    {
      label: "Lavori aperti",
      value: technicalState.status === "success" ? formatIntegerValue(lavoriAperti.length) : "--",
      meta:
        technicalState.status === "success"
          ? "Backlog tecnico pronto alla lettura."
          : technicalState.error ?? "Blocco tecnico non leggibile.",
      tone: lavoriAperti.length > 0 ? ("warning" as const) : ("success" as const),
    },
    {
      label: "Manutenzione",
      value:
        maintenanceState.status === "success" && scheduledMaintenance
          ? renderScheduledMaintenanceStatusLabel(scheduledMaintenance.status)
          : "--",
      meta:
        maintenanceState.status === "success"
          ? scheduledMaintenance
            ? renderScheduledMaintenanceMeta(scheduledMaintenance)
            : "Nessuna pianificazione manutentiva attiva sul mezzo."
          : maintenanceState.error ?? "Layer manutenzioni non leggibile.",
      tone:
        maintenanceState.status === "success" && scheduledMaintenance?.status === "scaduta"
          ? ("warning" as const)
          : ("accent" as const),
    },
    {
      label: "Rifornimenti",
      value:
        refuelState.status === "success"
          ? formatIntegerValue(refuelSnapshot?.counts.total ?? 0)
          : "--",
      meta:
        refuelState.status === "success"
          ? `Ultimo dato letto: ${latestRefuelDate ?? "non disponibile"}.`
          : refuelState.error ?? "Blocco D04 non leggibile.",
      tone: "success" as const,
    },
    {
      label: "Documenti e costi",
      value:
        documentCostsState.status === "success"
          ? formatIntegerValue(documentCostsSnapshot?.counts.total ?? 0)
          : "--",
      meta:
        documentCostsState.status === "success"
          ? `${formatIntegerValue(documentCostsSnapshot?.counts.preventivi ?? 0)} preventivi, ${formatIntegerValue(documentCostsSnapshot?.counts.fatture ?? 0)} fatture.`
          : documentCostsState.error ?? "Cluster D07/D08 non leggibile.",
      tone: "accent" as const,
    },
  ];

  const summaryCards = [
    {
      label: "Stato dossier",
      value: overview?.statusLabel ?? "--",
      meta:
        overview?.statusMeta ??
        "Il quadro mezzo-centrico verra mostrato quando il Dossier sara leggibile.",
      tone: "accent" as const,
    },
    {
      label: "Lavori aperti",
      value: technicalState.status === "success" ? formatIntegerValue(lavoriAperti.length) : "--",
      meta:
        technicalState.status === "success"
          ? "Backlog tecnico letto dal layer D02 senza workflow legacy."
          : technicalState.error ?? "Il blocco tecnico non e ancora leggibile.",
      tone: lavoriAperti.length > 0 ? ("warning" as const) : ("success" as const),
    },
    {
      label: "Manutenzione programmata",
      value:
        maintenanceState.status === "success" && scheduledMaintenance
          ? renderScheduledMaintenanceStatusLabel(scheduledMaintenance.status)
          : "--",
      meta:
        maintenanceState.status === "success"
          ? "Stato ricostruito dal layer manutenzioni dedicato, sempre read-only."
          : maintenanceState.error ?? "Il layer manutenzioni non e ancora leggibile.",
      tone:
        maintenanceState.status === "success" && scheduledMaintenance?.status === "scaduta"
          ? ("warning" as const)
          : ("default" as const),
    },
    {
      label: "Rifornimenti letti",
      value:
        refuelState.status === "success"
          ? formatIntegerValue(refuelSnapshot?.counts.total ?? 0)
          : "--",
      meta:
        refuelState.status === "success"
          ? "Record utili prodotti dal modello pulito D04."
          : refuelState.error ?? "Il blocco rifornimenti non e ancora leggibile.",
      tone:
        refuelState.status === "success" && (refuelSnapshot?.counts.reconstructed ?? 0) > 0
          ? ("success" as const)
          : ("default" as const),
    },
    {
      label: "Storico manutenzioni",
      value:
        maintenanceState.status === "success"
          ? formatIntegerValue(maintenanceCounts?.totaleStorico ?? 0)
          : "--",
      meta: latestMaintenanceDate
        ? `Ultimo intervento letto: ${latestMaintenanceDate}.`
        : "Nessun storico manutentivo letto per questa targa.",
      tone: "default" as const,
    },
    {
      label: "Litri leggibili D04",
      value:
        refuelState.status === "success"
          ? `${formatLitriValue(refuelSnapshot?.totals.litri ?? null)} L`
          : "--",
      meta: latestRefuelDate
        ? `Ultimo rifornimento letto: ${latestRefuelDate}.`
        : "Nessun rifornimento disponibile nel modello D04.",
      tone: "default" as const,
    },
    {
      label: "Autista anagrafico",
      value: mezzo?.autistaNome ?? "Non valorizzato",
      meta: "Dato D01: supporta il contesto mezzo ma non equivale a sessione live.",
      tone: "success" as const,
    },
    {
      label: "Costo leggibile D04",
      value:
        refuelState.status === "success"
          ? formatCurrencyValue(refuelSnapshot?.totals.costo ?? null)
          : "--",
      meta:
        refuelState.status === "success"
          ? `Copertura con autista: ${formatIntegerValue(refuelSnapshot?.counts.withAutista ?? null)} record.`
          : "Costo non disponibile finche D04 non e leggibile.",
      tone: "default" as const,
    },
    {
      label: "Preventivi letti",
      value:
        documentCostsState.status === "success"
          ? formatIntegerValue(documentCostsSnapshot?.counts.preventivi ?? 0)
          : "--",
      meta:
        documentCostsState.status === "success"
          ? renderDocumentTotalsSummary(documentCostsSnapshot?.totals.preventivi ?? null)
          : documentCostsState.error ?? "Il blocco documenti e costi non e ancora leggibile.",
      tone:
        documentCostsState.status === "success" &&
        (documentCostsSnapshot?.counts.preventivi ?? 0) > 0
          ? ("accent" as const)
          : ("default" as const),
    },
    {
      label: "Fatture lette",
      value:
        documentCostsState.status === "success"
          ? formatIntegerValue(documentCostsSnapshot?.counts.fatture ?? 0)
          : "--",
      meta:
        documentCostsState.status === "success"
          ? renderDocumentTotalsSummary(documentCostsSnapshot?.totals.fatture ?? null)
          : documentCostsState.error ?? "Il blocco documenti e costi non e ancora leggibile.",
      tone:
        documentCostsState.status === "success" &&
        (documentCostsSnapshot?.counts.fatture ?? 0) > 0
          ? ("warning" as const)
          : ("default" as const),
    },
  ];
  const secondarySummaryCards = summaryCards.filter(
    (card) => !["Lavori aperti", "Manutenzione programmata", "Rifornimenti letti"].includes(card.label)
  );
  const supportCards = [
    {
      title: "Convergenza attiva",
      description: "Blocchi davvero attivi nel Dossier, con peso informativo secondario.",
      items: overview?.importedBlockLabels ?? [],
      tone: "success" as const,
    },
    {
      title: "Perimetro escluso",
      description: "Cosa resta volutamente fuori dalla pagina e dal perimetro v1.",
      items: overview?.excludedBlockLabels ?? [],
      tone: "default" as const,
    },
    {
      title: "Reader e layer",
      description: "Base tecnica usata dalla pagina, senza logica raw lato UI.",
      items: overview?.readerLabels ?? [],
      tone: "accent" as const,
    },
    {
      title: "Prossime convergenze",
      description: "Passi ammessi dalla matrice, tenuti in fascia bassa e non come CTA dominante.",
      items: overview?.nextConvergenceLabels ?? [],
      tone: "default" as const,
    },
  ];
  const supportToneClassName = (tone: "accent" | "success" | "warning" | "default") =>
    tone === "accent"
      ? "next-panel next-panel--secondary next-tone next-tone--accent"
      : tone === "success"
      ? "next-panel next-panel--secondary next-tone next-tone--success"
      : tone === "warning"
      ? "next-panel next-panel--secondary next-tone next-tone--warning"
      : "next-panel next-panel--secondary";

  return (
    <section className="next-page next-dossier-shell">
      <header className="next-page__hero">
        <div>
          <Link className="next-back-link" to={listPath}>
            Torna all&apos;elenco mezzi
          </Link>
          <p className="next-page__eyebrow">{area.eyebrow}</p>
          <h1>{mezzo ? `Dossier ${mezzo.targa}` : "Dossier Mezzo NEXT"}</h1>
          <p className="next-page__description">
            Vista mezzo-centrica unica del mezzo. Il Dossier resta `read-only`, consolida `D01`,
            `D02`, il blocco manutenzioni dedicato, `D04` e il cluster `Documenti e costi` in un
            solo quadro operativo, senza toccare la madre e senza portare raw, tmp o fallback nella
            UI.
          </p>
        </div>

        <div className="next-page__meta">
          <span className="next-chip next-chip--success">DOSSIER READ-ONLY</span>
          {allowedRoleLabels.map((scope) => (
            <span key={scope} className="next-chip">
              {scope}
            </span>
          ))}
          <span className="next-chip next-chip--subtle">
            Ruolo simulato: {NEXT_ROLE_PRESETS[role].shortLabel}
          </span>
          <span className="next-chip next-chip--accent">
            {overview?.statusLabel ?? "Quadro mezzo-centrico in caricamento"}
          </span>
          <span className="next-chip next-chip--warning">Nessuna scrittura</span>
        </div>
      </header>

      {status === "loading" ? (
        <div className="next-data-state next-tone next-tone--accent">
          <strong>Caricamento Dossier mezzo</strong>
          <span>
            Sto componendo il quadro mezzo-centrico unico a partire dai layer D01, D02, D04 e
            D07/D08.
          </span>
        </div>
      ) : null}

      {status === "error" || status === "not-found" ? (
        <div className="next-data-state next-tone next-tone--warning">
          <strong>Dossier non disponibile</strong>
          <span>{error}</span>
          <Link className="next-inline-link" to={listPath}>
            Torna all&apos;elenco mezzi
          </Link>
        </div>
      ) : null}

      {status === "success" && mezzo && overview ? (
        <>
          <section className="next-dossier-hero-card next-tone">
            <div className="next-dossier-hero-card__main">
              <div className="next-panel__header">
                <div>
                  <p className="next-page__eyebrow">Pivot mezzo</p>
                  <h2>{mezzo.targa}</h2>
                </div>
                <Link className="next-inline-link" to={listPath}>
                  Elenco mezzi
                </Link>
              </div>
              <p className="next-panel__description">
                Il Dossier parte dal mezzo come pivot stabile e compone un quadro manageriale unico:
                identita, stato sintetico e primi segnali decisionali in un solo colpo d&apos;occhio.
              </p>

              <div className="next-dossier-hero-card__identity">
                <div className="next-dossier-map__row">
                  <strong>Categoria</strong>
                  <span>{mezzo.categoria}</span>
                </div>
                <div className="next-dossier-map__row">
                  <strong>Marca / modello</strong>
                  <span>{renderMarcaModello(mezzo)}</span>
                </div>
                <div className="next-dossier-map__row">
                  <strong>Autista anagrafico</strong>
                  <span>{mezzo.autistaNome ?? "Non valorizzato"}</span>
                </div>
                <div className="next-dossier-map__row">
                  <strong>Origine lettura</strong>
                  <span>
                    {mezzo.sourceCollection}/{mezzo.sourceKey}
                  </span>
                </div>
              </div>
            </div>

            <div className="next-dossier-hero-card__side">
              <div className="next-data-state next-tone next-tone--accent">
                <strong>{overview.statusLabel}</strong>
                <span>{overview.statusMeta}</span>
              </div>
              <div className="next-control-list">
                {overview.keySignals.map((item) => (
                  <div key={item} className="next-control-list__item next-control-list__item--soft">
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="next-dossier-spotlight-grid">
            {primaryHeroCards.map((card) => (
              <article key={card.label} className={`${renderSummaryToneClassName(card.tone)} next-summary-card--spotlight`}>
                <p className="next-summary-card__label">{card.label}</p>
                <strong className="next-summary-card__value">{card.value}</strong>
                <p className="next-summary-card__meta">{card.meta}</p>
              </article>
            ))}
          </section>

          <section className="next-summary-grid next-summary-grid--compact">
            {secondarySummaryCards.map((card) => (
              <article key={card.label} className={`${renderSummaryToneClassName(card.tone)} next-summary-card--compact`}>
                <p className="next-summary-card__label">{card.label}</p>
                <strong className="next-summary-card__value">{card.value}</strong>
                <p className="next-summary-card__meta">{card.meta}</p>
              </article>
            ))}
          </section>

          <section className="next-panel next-dossier-section-card next-tone next-tone--accent">
              <div className="next-panel__header">
                <h2>Stato tecnico del mezzo</h2>
                <span className="next-chip next-chip--accent">D02 + manutenzioni read-only</span>
              </div>
              <p className="next-panel__description">
                Backlog lavori, storico manutenzioni e manutenzione programmata sono letti come un
                solo quadro tecnico del mezzo. La UI non importa workflow, writer o route della
                madre: legge solo output puliti dei layer NEXT.
              </p>

              {technicalState.status === "error" ? (
                <div className="next-data-state next-tone next-tone--warning">
                  <strong>Blocco lavori non disponibile</strong>
                  <span>{technicalState.error}</span>
                </div>
              ) : null}

              {maintenanceState.status === "error" ? (
                <div className="next-data-state next-tone next-tone--warning">
                  <strong>Blocco manutenzioni non disponibile</strong>
                  <span>{maintenanceState.error}</span>
                </div>
              ) : null}

              {technicalState.status === "success" || maintenanceState.status === "success" ? (
                <>
                  <div className="next-dossier-section-intro">
                    <article className="next-data-state next-tone">
                      <strong>Quadro tecnico sintetico</strong>
                      <span>
                        Lavori aperti: {formatIntegerValue(technicalSnapshot?.counts.lavoriAperti ?? null)}
                        {" | "}Storico manutenzioni: {formatIntegerValue(maintenanceCounts?.totaleStorico ?? null)}
                        {" | "}Ultima manutenzione: {latestMaintenanceDate ?? "non disponibile"}
                      </span>
                    </article>
                  </div>
                  <div className="next-section-grid next-section-grid--technical">
                    <article className="next-inline-panel">
                      <h3>Lavori aperti</h3>
                      <p>Backlog tecnico mezzo-centrico letto dal layer D02.</p>
                      {technicalState.status !== "success" || lavoriApertiPreview.length === 0 ? (
                        <div className="next-data-state">
                          <strong>Nessun lavoro aperto</strong>
                          <span>
                            {technicalState.status === "success"
                              ? "Il layer D02 non ha trovato backlog tecnico per questa targa."
                              : "Il backlog aperto non e disponibile nel quadro attuale."}
                          </span>
                        </div>
                      ) : (
                        <div className="next-control-list">
                          {lavoriApertiPreview.map((item) => (
                            <div key={item.id} className="next-control-list__item">
                              <div className="next-global-pillbar">
                                <span className="next-chip next-chip--accent">Aperto</span>
                                {item.urgenza ? (
                                  <span className="next-chip next-chip--warning">
                                    Urgenza {item.urgenza}
                                  </span>
                                ) : null}
                              </div>
                              <strong>{renderOptionalLabel(item.descrizione)}</strong>
                              <span>{renderLavoroMeta(item)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </article>

                    <article className="next-inline-panel">
                      <h3>Lavori chiusi</h3>
                      <p>Primi esiti tecnici letti dal layer D02 senza importare il workflow legacy.</p>
                      {technicalState.status !== "success" || lavoriChiusiPreview.length === 0 ? (
                        <div className="next-data-state">
                          <strong>Nessun lavoro chiuso</strong>
                          <span>
                            {technicalState.status === "success"
                              ? "Il layer D02 non ha trovato lavori segnati come eseguiti."
                              : "Il riepilogo lavori chiusi non e disponibile nel quadro attuale."}
                          </span>
                        </div>
                      ) : (
                        <div className="next-control-list">
                          {lavoriChiusiPreview.map((item) => (
                            <div key={item.id} className="next-control-list__item">
                              <div className="next-global-pillbar">
                                <span className="next-chip next-chip--success">Eseguito</span>
                              </div>
                              <strong>{renderOptionalLabel(item.descrizione)}</strong>
                              <span>{renderLavoroMeta(item)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </article>

                    <article className="next-inline-panel">
                      <h3>Manutenzione programmata</h3>
                      <p>Stato letto dal layer manutenzioni dedicato, senza writer della madre.</p>
                      {maintenanceState.status !== "success" || !scheduledMaintenance ? (
                        <div className="next-data-state">
                          <strong>Stato programmato non disponibile</strong>
                          <span>Il layer manutenzioni non ha restituito la pianificazione del mezzo.</span>
                        </div>
                      ) : (
                        <div className="next-control-list">
                          <div className="next-control-list__item">
                            <div className="next-global-pillbar">
                              <span
                                className={getScheduledMaintenanceToneClassName(
                                  scheduledMaintenance.status
                                )}
                              >
                                {renderScheduledMaintenanceStatusLabel(scheduledMaintenance.status)}
                              </span>
                              <span className="next-chip next-chip--subtle">
                                {renderMaintenanceQualityLabel(scheduledMaintenance.quality)}
                              </span>
                              <span className="next-chip next-chip--subtle">
                                {scheduledMaintenance.dataFine ?? "Data fine non valorizzata"}
                              </span>
                            </div>
                            <strong>
                              {scheduledMaintenance.enabled
                                ? "Pianificazione manutentiva attiva"
                                : "Nessuna manutenzione programmata attiva"}
                            </strong>
                            <span>{renderScheduledMaintenanceMeta(scheduledMaintenance)}</span>
                            <span>
                              Inizio:{" "}
                              {renderOptionalLabel(
                                scheduledMaintenance.dataInizio,
                                "non valorizzato"
                              )}
                              {" | "}KM max:{" "}
                              {renderOptionalLabel(
                                scheduledMaintenance.kmMax,
                                "non valorizzato"
                              )}
                              {" | "}Contratto:{" "}
                              {renderOptionalLabel(
                                scheduledMaintenance.contratto,
                                "non valorizzato"
                              )}
                            </span>
                          </div>
                        </div>
                      )}
                    </article>

                    <article className="next-inline-panel">
                      <h3>Ultime manutenzioni</h3>
                      <p>
                        Storico interventi mezzo-centrico. Il Dossier mostra solo i record del
                        layer dedicato, senza aprire costi o magazzino.
                      </p>
                      {maintenanceState.status !== "success" || maintenanceHistoryPreview.length === 0 ? (
                        <div className="next-data-state">
                          <strong>Nessuna manutenzione letta</strong>
                          <span>
                            {maintenanceState.status === "success"
                              ? "Il layer dedicato non ha trovato storico manutentivo per questa targa."
                              : "Lo storico manutenzioni non e disponibile nel quadro attuale."}
                          </span>
                        </div>
                      ) : (
                        <>
                          <div className="next-data-state next-tone">
                            <strong>
                              Anteprima dossier: ultime{" "}
                              {formatIntegerValue(maintenanceHistoryPreview.length)} manutenzioni
                            </strong>
                            <span>
                              Totale storico ricostruito per questo mezzo:{" "}
                              {formatIntegerValue(maintenanceHistory.length)}.
                            </span>
                            <div className="next-access-page__actions">
                              {hasMaintenanceFullView ? (
                                <button
                                  type="button"
                                  className="next-action-link next-action-link--primary"
                                  onClick={() => setShowAllMaintenance(true)}
                                >
                                  Vedi tutte
                                </button>
                              ) : null}
                              {showAllMaintenance ? (
                                <button
                                  type="button"
                                  className="next-action-link"
                                  onClick={() => setShowAllMaintenance(false)}
                                >
                                  Chiudi vista completa
                                </button>
                              ) : null}
                            </div>
                          </div>

                          <div className="next-control-list">
                            {maintenanceHistoryPreview.map((item) => (
                              <div key={item.id} className="next-control-list__item">
                                <div className="next-global-pillbar">
                                  <span className="next-chip next-chip--subtle">
                                    {item.dataRaw ?? "Data non disponibile"}
                                  </span>
                                  {item.tipo ? (
                                    <span className="next-chip next-chip--subtle">{item.tipo}</span>
                                  ) : null}
                                  {item.isCambioGommeDerived ? (
                                    <span className="next-chip next-chip--warning">Gomme</span>
                                  ) : null}
                                  <span className="next-chip next-chip--subtle">
                                    {renderMaintenanceQualityLabel(item.quality)}
                                  </span>
                                </div>
                                <strong>{renderOptionalLabel(item.descrizione)}</strong>
                                <span>{renderMaintenanceHistoryMeta(item)}</span>
                              </div>
                            ))}
                          </div>

                          {showAllMaintenance ? (
                            <div className="next-inline-panel">
                              <div className="next-panel__header">
                                <h3>Vista completa manutenzioni</h3>
                                <span className="next-chip next-chip--accent">
                                  {formatIntegerValue(maintenanceHistory.length)} record
                                </span>
                              </div>
                              <p>
                                Vista completa read-only del blocco manutenzioni. Anche qui la UI
                                legge solo il modello pulito del layer NEXT.
                              </p>
                              <div className="next-control-list">
                                {maintenanceHistory.map((item) => (
                                  <div key={item.id} className="next-control-list__item">
                                    <div className="next-global-pillbar">
                                      <span className="next-chip next-chip--subtle">
                                        {item.dataRaw ?? "Data non disponibile"}
                                      </span>
                                      {item.tipo ? (
                                        <span className="next-chip next-chip--subtle">
                                          {item.tipo}
                                        </span>
                                      ) : null}
                                      {item.isCambioGommeDerived ? (
                                        <span className="next-chip next-chip--warning">Gomme</span>
                                      ) : null}
                                      <span className="next-chip next-chip--subtle">
                                        {renderMaintenanceQualityLabel(item.quality)}
                                      </span>
                                    </div>
                                    <strong>{renderOptionalLabel(item.descrizione)}</strong>
                                    <span>{renderMaintenanceHistoryMeta(item)}</span>
                                    <span>
                                      Origine: {item.sourceOrigin} {" | "}Dataset: {item.sourceDataset}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </>
                      )}
                    </article>
                  </div>
                </>
              ) : null}
          </section>

          <section className="next-panel next-dossier-section-card next-tone next-tone--success">
              <div className="next-panel__header">
                <h2>Rifornimenti del mezzo</h2>
                <span className="next-chip next-chip--success">
                  {renderRefuelStatusLabel(refuelState.status, refuelSnapshot)}
                </span>
              </div>
              <p className="next-panel__description">
                Il Dossier mostra i rifornimenti solo tramite il modello D04 pulito. Dataset raw,
                tmp, shape legacy e merge controllati restano confinati nel layer NEXT.
              </p>

              {refuelState.status === "error" ? (
                <div className="next-data-state next-tone next-tone--warning">
                  <strong>Blocco rifornimenti non disponibile</strong>
                  <span>{refuelState.error}</span>
                </div>
              ) : null}

              {refuelState.status === "success" ? (
                <>
                  <div className="next-data-state next-tone">
                    <strong>Quadro D04 del mezzo</strong>
                    <span>
                      Totale rifornimenti utili: {formatIntegerValue(refuelSnapshot?.counts.total ?? null)}
                      {" | "}Litri leggibili: {formatLitriValue(refuelSnapshot?.totals.litri ?? null)} L
                      {" | "}Costo leggibile: {formatCurrencyValue(refuelSnapshot?.totals.costo ?? null)}
                    </span>
                  </div>

                  {refuelsPreview.length === 0 ? (
                    <div className="next-data-state">
                      <strong>Nessun rifornimento ricostruito</strong>
                      <span>
                        Il layer D04 non ha trovato record utili per questa targa dopo la
                        ricostruzione controllata.
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="next-data-state next-tone next-tone--accent">
                        <strong>
                          Anteprima dossier: ultimi {formatIntegerValue(refuelsPreview.length)} rifornimenti
                        </strong>
                        <span>
                          Il Dossier mostra i 5 record piu recenti. Totale ricostruito per questo mezzo:{" "}
                          {formatIntegerValue(refuels.length)}.
                        </span>
                        <div className="next-access-page__actions">
                          {hasRefuelFullView ? (
                            <button
                              type="button"
                              className="next-action-link next-action-link--primary"
                              onClick={() => setShowAllRefuels(true)}
                            >
                              Vedi tutti
                            </button>
                          ) : null}
                          {showAllRefuels ? (
                            <button
                              type="button"
                              className="next-action-link"
                              onClick={() => setShowAllRefuels(false)}
                            >
                              Chiudi vista completa
                            </button>
                          ) : null}
                        </div>
                      </div>

                      <div className="next-control-list">
                        {refuelsPreview.map((item) => renderRefuelReadOnlyCard(item))}
                      </div>

                      {showAllRefuels ? (
                        <div className="next-inline-panel">
                          <div className="next-panel__header">
                            <h3>Vista completa D04</h3>
                            <span className="next-chip next-chip--accent">
                              {formatIntegerValue(refuels.length)} record
                            </span>
                          </div>
                          <p>
                            Vista completa read-only del mezzo. Anche qui la pagina consuma solo
                            il modello pulito prodotto dal layer D04.
                          </p>
                          <div className="next-control-list">
                            {refuels.map((item) => renderRefuelReadOnlyCard(item))}
                          </div>
                        </div>
                      ) : null}
                    </>
                  )}
                </>
              ) : null}
          </section>

          <section className="next-panel next-dossier-section-card next-tone next-tone--accent">
              <div className="next-panel__header">
                <h2>Documenti e costi</h2>
                <span className="next-chip next-chip--accent">
                  {renderDocumentCostStatusLabel(documentCostsState.status, documentCostsSnapshot)}
                </span>
              </div>
              <p className="next-panel__description">
                Il Dossier mostra un solo cluster mezzo-centrico di preventivi, fatture e altri
                documenti utili. La complessita legacy resta nel layer D07/D08: la UI NEXT legge
                solo record puliti con provenienza esplicita.
              </p>

              {documentCostsState.status === "error" ? (
                <div className="next-data-state next-tone next-tone--warning">
                  <strong>Blocco documenti e costi non disponibile</strong>
                  <span>{documentCostsState.error}</span>
                </div>
              ) : null}

              {documentCostsState.status === "success" ? (
                <>
                  <div className="next-data-state next-tone">
                    <strong>Quadro D07/D08 del mezzo</strong>
                    <span>
                      Preventivi: {formatIntegerValue(documentCostsSnapshot?.counts.preventivi ?? null)}
                      {" | "}Fatture: {formatIntegerValue(documentCostsSnapshot?.counts.fatture ?? null)}
                      {" | "}Documenti utili:{" "}
                      {formatIntegerValue(documentCostsSnapshot?.counts.documentiUtili ?? null)}
                    </span>
                  </div>

                  <div className="next-section-grid">
                    <article className="next-inline-panel">
                      <h3>Ultimi preventivi</h3>
                      <p>
                        Preview read-only dei preventivi mezzo-centrici letti dal layer, senza
                        workflow approvativo o UI legacy.
                      </p>
                      {preventiviPreview.length === 0 ? (
                        <div className="next-data-state">
                          <strong>Nessun preventivo letto</strong>
                          <span>
                            Il layer D07/D08 non ha trovato preventivi mezzo-centrici utili per
                            questa targa.
                          </span>
                        </div>
                      ) : (
                        <>
                          <div className="next-data-state next-tone next-tone--accent">
                            <strong>
                              Anteprima dossier: ultimi {formatIntegerValue(preventiviPreview.length)}{" "}
                              preventivi
                            </strong>
                            <span>
                              Totali prudenti:{" "}
                              {renderDocumentTotalsSummary(
                                documentCostsSnapshot?.totals.preventivi ?? null
                              )}
                            </span>
                          </div>
                          <div className="next-control-list">
                            {preventiviPreview.map((item) => renderDocumentCostReadOnlyCard(item))}
                          </div>
                        </>
                      )}
                    </article>

                    <article className="next-inline-panel">
                      <h3>Ultime fatture</h3>
                      <p>
                        Preview sintetica delle fatture correlate al mezzo, con importi solo quando
                        davvero leggibili.
                      </p>
                      {fatturePreview.length === 0 ? (
                        <div className="next-data-state">
                          <strong>Nessuna fattura letta</strong>
                          <span>
                            Il layer D07/D08 non ha trovato fatture mezzo-centriche utili per
                            questa targa.
                          </span>
                        </div>
                      ) : (
                        <>
                          <div className="next-data-state next-tone next-tone--warning">
                            <strong>
                              Anteprima dossier: ultime {formatIntegerValue(fatturePreview.length)}{" "}
                              fatture
                            </strong>
                            <span>
                              Totali prudenti:{" "}
                              {renderDocumentTotalsSummary(
                                documentCostsSnapshot?.totals.fatture ?? null
                              )}
                            </span>
                          </div>
                          <div className="next-control-list">
                            {fatturePreview.map((item) => renderDocumentCostReadOnlyCard(item))}
                          </div>
                        </>
                      )}
                    </article>

                    <article className="next-inline-panel">
                      <h3>Altri documenti utili</h3>
                      <p>
                        Il Dossier include solo documenti realmente targa-correlati letti nelle
                        collezioni documentali, senza trasformare l&apos;intake globale in pagina
                        dossierizzata.
                      </p>
                      {documentiUtiliPreview.length === 0 ? (
                        <div className="next-data-state">
                          <strong>Nessun documento utile letto</strong>
                          <span>
                            Nessun documento mezzo-correlato extra e risultato leggibile nel
                            perimetro attuale.
                          </span>
                        </div>
                      ) : (
                        <div className="next-control-list">
                          {documentiUtiliPreview.map((item) => renderDocumentCostReadOnlyCard(item))}
                        </div>
                      )}
                    </article>
                  </div>
                </>
              ) : null}
          </section>

          <section className="next-section-grid next-section-grid--support">
            <article className={supportToneClassName("success")}>
              <div className="next-panel__header">
                <h2>Coperture dossier</h2>
              </div>
              <p className="next-panel__description">
                Contatori di copertura tenuti in fascia secondaria per non competere con i dati
                principali del mezzo.
              </p>
              <ul className="next-panel__list">
                <li>lavori aperti: {formatIntegerValue(technicalSnapshot?.counts.lavoriAperti ?? null)}</li>
                <li>lavori chiusi: {formatIntegerValue(technicalSnapshot?.counts.lavoriChiusi ?? null)}</li>
                <li>storico manutenzioni: {formatIntegerValue(maintenanceCounts?.totaleStorico ?? null)}</li>
                <li>record con materiali: {formatIntegerValue(maintenanceCounts?.conMateriali ?? null)}</li>
                <li>rifornimenti D04: {formatIntegerValue(refuelSnapshot?.counts.total ?? null)}</li>
                <li>documenti/costi: {formatIntegerValue(documentCostsSnapshot?.counts.total ?? null)}</li>
              </ul>
            </article>

            <article className={supportToneClassName("warning")}>
              <div className="next-panel__header">
                <h2>Limiti attuali</h2>
              </div>
              <p className="next-panel__description">
                Limiti e perimetro restano disponibili, ma con peso visivo ridotto e concentrati in
                fondo pagina.
              </p>
              <ul className="next-panel__list">
                {overview.technicalLimitations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
                {overview.refuelLimitations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
                {overview.documentCostLimitations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
                <li>nessun PDF runtime nuovo, nessun upload, nessuna delete e nessuna modale legacy</li>
              </ul>
            </article>

            {supportCards.map((card) => (
              <article key={card.title} className={supportToneClassName(card.tone)}>
                <div className="next-panel__header">
                  <h2>{card.title}</h2>
                </div>
                <p className="next-panel__description">{card.description}</p>
                <ul className="next-panel__list">
                  {card.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}

            <article className={supportToneClassName("success")}>
              <div className="next-panel__header">
                <h2>Stato del perimetro</h2>
              </div>
              <p className="next-panel__description">
                Promemoria sintetico del perimetro Dossier raggiunto oggi.
              </p>
              <ul className="next-panel__list">
                {dossierStatusItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </section>
        </>
      ) : null}
    </section>
  );
}

export default NextDossierMezzoPage;
