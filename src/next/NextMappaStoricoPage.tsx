import { useEffect, useMemo, useState } from "react";
import {
  deleteNextMappaStoricoHotspot,
  readNextMappaStoricoSnapshot,
  saveNextMappaStoricoHotspot,
  uploadNextMappaStoricoPhoto,
  type NextMappaStoricoHotspotRecord,
  type NextMappaStoricoIntervento,
  type NextMappaStoricoSnapshot,
} from "./domain/nextMappaStoricoDomain";
import { normalizeNextAssiCoinvolti } from "./domain/nextManutenzioniGommeDomain";
import type { NextManutenzioniLegacyDatasetRecord } from "./domain/nextManutenzioniDomain";
import {
  getNextMezzoHotspotAreaById,
  getNextMezzoHotspotTargetKindById,
  getNextMezzoHotspotAreasByVista,
  type NextMappaStoricoVista,
} from "./mezziHotspotAreas";
import "./next-mappa-storico.css";

type ManutenzioneLegacy = NextManutenzioniLegacyDatasetRecord;
type SelectedMaintenance = Partial<NextManutenzioniLegacyDatasetRecord> & { id: string };
type MezzoInfo = {
  targa: string;
  mezzoLabel: string;
  autistaNome: string | null;
  categoria: string | null;
  kmAttuali: number | null;
  latestGommeKmCambio: number | null;
  ultimaManutenzione: string | null;
  ultimoInterventoMezzo: string | null;
  ultimoInterventoCompressore: string | null;
  ultimeManutenzioniMezzo: Array<{ id: string; data: string; title: string }>;
  ultimeManutenzioniCompressore: Array<{ id: string; data: string; title: string }>;
};
type DetailFilterKey = "tutte" | "mezzo" | "gomme" | "rimorchio" | "compressore";
type DetailCategory = Exclude<DetailFilterKey, "tutte">;

type NextMappaStoricoPageProps = {
  targa: string;
  embedded?: boolean;
  photoManager?: boolean;
  selectedMaintenance?: SelectedMaintenance | null;
  mezzoInfo?: MezzoInfo;
  storicoManutenzioni: ManutenzioneLegacy[];
  kmAttuali?: number | null;
  onOpenPdf?: () => void;
  onOpenDossier?: () => void;
  onEditLatest?: () => void;
  onDelete?: (record: SelectedMaintenance) => void;
  onSelectMaintenance?: (recordId: string | null) => void;
  onOpenDocument?: (record: ManutenzioneLegacy) => void;
  onDownloadPdfSingle?: (record: ManutenzioneLegacy) => void;
};

type ModalKind = "ultimi" | "frequenti" | "perzona" | null;

const VISTE: NextMappaStoricoVista[] = ["fronte", "sinistra", "destra", "retro"];
const DETAIL_FILTER_ORDER: DetailFilterKey[] = [
  "tutte",
  "mezzo",
  "gomme",
  "rimorchio",
  "compressore",
];
const DETAIL_FILTER_LABELS: Record<DetailFilterKey, string> = {
  tutte: "Tutte",
  mezzo: "Mezzo",
  gomme: "Gomme",
  rimorchio: "Rimorchio",
  compressore: "Compressore",
};

function formatInterventoMeta(intervento: NextMappaStoricoIntervento): string {
  const chunks = [
    intervento.dataLabel,
    intervento.kmLabel ? `Km: ${intervento.kmLabel}` : null,
    intervento.fornitoreLabel || null,
  ].filter(Boolean);
  return chunks.join(" - ");
}

function getZonaLabel(areaId: string | null): string {
  if (!areaId) return "";
  return getNextMezzoHotspotAreaById(areaId)?.label ?? areaId;
}

function formatVistaLabel(vista: NextMappaStoricoVista): string {
  return vista.charAt(0).toUpperCase() + vista.slice(1);
}

function formatNumberOptional(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("it-IT").format(value);
}

function parseLegacyDateParts(value: string | null | undefined): {
  day: string;
  monthYear: string;
} {
  const normalized = value?.trim() ?? "";
  const match = normalized.match(/^(\d{1,2})[./\s-](\d{1,2})[./\s-](\d{2,4})$/);
  if (!match) {
    return { day: "—", monthYear: normalized || "—" };
  }

  const [, dayRaw, monthRaw, yearRaw] = match;
  return {
    day: dayRaw.padStart(2, "0"),
    monthYear: `${monthRaw.padStart(2, "0")}/${yearRaw.slice(-2)}`,
  };
}

function formatKmDeltaLabel(delta: number | null): string | null {
  if (delta == null || !Number.isFinite(delta) || delta <= 0) return null;
  return `+${new Intl.NumberFormat("it-IT").format(delta)} km fa`;
}

function formatMaintenanceMetricInline(record: SelectedMaintenance | ManutenzioneLegacy): string {
  if (record.km != null) return `Km ${formatNumberOptional(record.km)}`;
  if (record.ore != null) return `${formatNumberOptional(record.ore)} ore`;
  return "—";
}

function formatMaintenanceTitle(record: SelectedMaintenance | ManutenzioneLegacy): string {
  const sottotipo = record.sottotipo?.trim();
  if (sottotipo) return sottotipo;

  const descrizione = record.descrizione?.replace(/\s+/g, " ").trim() ?? "";
  if (descrizione) {
    const firstSentence = descrizione.split(".")[0]?.trim() ?? descrizione;
    if (firstSentence.length <= 60) return firstSentence;
    return `${firstSentence.slice(0, 57).trimEnd()}...`;
  }

  const tipo = record.tipo?.trim();
  if (!tipo) return "Manutenzione";
  return `${tipo.slice(0, 1).toUpperCase()}${tipo.slice(1)}`;
}

function formatAsseLabel(value: string): string {
  switch (value) {
    case "anteriore":
      return "Anteriore";
    case "posteriore":
      return "Posteriore";
    case "asse1":
      return "Asse 1";
    case "asse2":
      return "Asse 2";
    case "asse3":
      return "Asse 3";
    default:
      return value;
  }
}

function resolveDetailCategory(record: SelectedMaintenance | ManutenzioneLegacy): DetailCategory {
  if (isTyreMaintenanceRecord(record)) return "gomme";
  if (record.tipo === "compressore") return "compressore";
  if (record.tipo === "attrezzature") return "rimorchio";
  return "mezzo";
}

function formatMaintenanceImporto(
  value: number | null | undefined,
  currency: "EUR" | "CHF" | "UNKNOWN" | null | undefined,
): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toLocaleString("it-IT", {
    style: "currency",
    currency: currency === "CHF" ? "CHF" : "EUR",
  });
}

function isTyreMaintenanceRecord(record: SelectedMaintenance | ManutenzioneLegacy | null | undefined): boolean {
  if (!record) return false;
  if ((record.assiCoinvolti?.length ?? 0) > 0) return true;
  if ((record.gommePerAsse?.length ?? 0) > 0) return true;
  if (record.gommeInterventoTipo) return true;
  const normalizedTipo = (record.tipo ?? "").trim().toLowerCase();
  if (normalizedTipo === "gomme") return true;
  const normalizedDescrizione = (record.descrizione ?? "").trim().toUpperCase();
  return normalizedDescrizione.includes("GOMME") || normalizedDescrizione.includes("PNEUM");
}

function getHotspotClassName(areaId: string): string {
  const targetKind = getNextMezzoHotspotTargetKindById(areaId);
  if (targetKind === "fanali_specchi") return "ms-hotspot ms-hotspot--fanali";
  if (targetKind === "attrezzature") return "ms-hotspot ms-hotspot--attrezzature";
  return "ms-hotspot ms-hotspot--assi";
}

export default function NextMappaStoricoPage({
  targa,
  embedded = false,
  photoManager = false,
  selectedMaintenance = null,
  mezzoInfo,
  storicoManutenzioni,
  kmAttuali,
  onOpenPdf,
  onOpenDossier,
  onEditLatest,
  onDelete,
  onSelectMaintenance,
  onOpenDocument,
  onDownloadPdfSingle,
}: NextMappaStoricoPageProps) {
  const normalizedTarga = targa.trim().toUpperCase().replace(/\s+/g, "");
  const [snapshot, setSnapshot] = useState<NextMappaStoricoSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vistaAttiva, setVistaAttiva] = useState<NextMappaStoricoVista>("sinistra");
  const [modalitaSetup, setModalitaSetup] = useState(false);
  const [zonaSelezionata, setZonaSelezionata] = useState<string | null>(null);
  const [pendingPos, setPendingPos] = useState<{ x: number; y: number } | null>(null);
  const [zonaPerPending, setZonaPerPending] = useState("");
  const [modalAperto, setModalAperto] = useState<ModalKind>(null);
  const [searchQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!normalizedTarga) {
      setSnapshot(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const nextSnapshot = await readNextMappaStoricoSnapshot(normalizedTarga);
        if (cancelled) return;
        setSnapshot(nextSnapshot);
      } catch (loadError) {
        console.error("Errore caricamento mappa storico:", loadError);
        if (cancelled) return;
        setSnapshot(null);
        setError("Impossibile caricare il dettaglio tecnico del mezzo selezionato.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [normalizedTarga]);

  useEffect(() => {
    const availableZones = getNextMezzoHotspotAreasByVista(vistaAttiva);
    if (!availableZones.some((area) => area.id === zonaPerPending)) {
      setZonaPerPending(availableZones[0]?.id ?? "");
    }
  }, [vistaAttiva, zonaPerPending]);

  useEffect(() => {
    if (!zonaSelezionata) return;
    const area = getNextMezzoHotspotAreaById(zonaSelezionata);
    if (!area) {
      setZonaSelezionata(null);
    }
  }, [zonaSelezionata]);

  const vistaSnapshot = snapshot?.viste[vistaAttiva] ?? null;
  const vistaLabel = formatVistaLabel(vistaAttiva);
  const [activeFilter, setActiveFilter] = useState<DetailFilterKey>("tutte");
  const selectedLegacyRecord = useMemo<ManutenzioneLegacy | null>(() => {
    if (!selectedMaintenance) return null;
    return storicoManutenzioni.find((item) => item.id === selectedMaintenance.id) ?? null;
  }, [selectedMaintenance, storicoManutenzioni]);
  const selectedRecord = selectedLegacyRecord ?? selectedMaintenance;
  const selectedCategory = useMemo(
    () => (selectedRecord ? resolveDetailCategory(selectedRecord) : null),
    [selectedRecord],
  );
  const selectedAxesNormalized = useMemo(
    () => normalizeNextAssiCoinvolti(selectedRecord?.assiCoinvolti ?? []),
    [selectedRecord],
  );
  const currentKmValue = kmAttuali ?? mezzoInfo?.kmAttuali ?? null;
  const filterCounts = useMemo<Record<DetailFilterKey, number>>(() => {
    const counts: Record<DetailFilterKey, number> = {
      tutte: storicoManutenzioni.length,
      mezzo: 0,
      gomme: 0,
      rimorchio: 0,
      compressore: 0,
    };

    for (const item of storicoManutenzioni) {
      counts[resolveDetailCategory(item)] += 1;
    }

    return counts;
  }, [storicoManutenzioni]);
  const activeFilters = useMemo(
    () => DETAIL_FILTER_ORDER.filter((item) => item === "tutte" || filterCounts[item] > 0),
    [filterCounts],
  );
  const filteredStorico = useMemo(() => {
    if (activeFilter === "tutte") return storicoManutenzioni;
    return storicoManutenzioni.filter((item) => resolveDetailCategory(item) === activeFilter);
  }, [activeFilter, storicoManutenzioni]);
  const selectedDeltaKm = useMemo(() => {
    if (currentKmValue == null || selectedRecord?.km == null) return null;
    const delta = currentKmValue - selectedRecord.km;
    return delta >= 0 ? delta : null;
  }, [currentKmValue, selectedRecord]);
  const showTyreSection = useMemo(() => {
    if (!selectedRecord || !isTyreMaintenanceRecord(selectedRecord)) return false;
    return (
      selectedAxesNormalized.length > 0 ||
      (selectedRecord.gommePerAsse?.length ?? 0) > 0 ||
      Boolean(selectedRecord.gommeInterventoTipo)
    );
  }, [selectedAxesNormalized, selectedRecord]);

  useEffect(() => {
    if (activeFilter !== "tutte" && filterCounts[activeFilter] === 0) {
      setActiveFilter("tutte");
    }
  }, [activeFilter, filterCounts]);

  useEffect(() => {
    const selectedId = selectedMaintenance?.id;
    if (!selectedId) return;
    const row = document.getElementById(`man2-detail-v2-row-${selectedId}`);
    row?.scrollIntoView({ block: "nearest" });
  }, [activeFilter, selectedMaintenance?.id]);

  const tutteLeZone = useMemo(
    () =>
      snapshot
        ? VISTE.flatMap((vista) => snapshot.viste[vista].aree)
        : [],
    [snapshot],
  );

  const zonaDettaglio = useMemo(() => {
    if (!zonaSelezionata) return null;
    return tutteLeZone.find((zona) => zona.areaId === zonaSelezionata) ?? null;
  }, [tutteLeZone, zonaSelezionata]);

  const searchResults = useMemo(() => {
    if (!snapshot) return [];
    const query = searchQuery.trim().toLowerCase();
    if (!query) return snapshot.interventi.slice(0, 12);
    return snapshot.interventi.filter((item) => item.searchText.includes(query));
  }, [searchQuery, snapshot]);

  const frequenzaZone = useMemo(
    () =>
      tutteLeZone
        .filter((zona) => zona.interventi.length > 0)
        .sort((left, right) => right.interventi.length - left.interventi.length),
    [tutteLeZone],
  );

  const areeSetupDisponibili = useMemo(
    () => getNextMezzoHotspotAreasByVista(vistaAttiva),
    [vistaAttiva],
  );

  async function reloadSnapshot(successMessage?: string) {
    if (!normalizedTarga) return;
    const nextSnapshot = await readNextMappaStoricoSnapshot(normalizedTarga);
    setSnapshot(nextSnapshot);
    if (successMessage) setMessage(successMessage);
  }

  async function handlePhotoUploadForVista(vista: NextMappaStoricoVista, file: File | null) {
    if (!file || !normalizedTarga) return;
    try {
      setSaving(true);
      setMessage(null);
      await uploadNextMappaStoricoPhoto({
        targa: normalizedTarga,
        vista,
        file,
      });
      await reloadSnapshot(`Foto ${vista} aggiornata.`);
    } catch (uploadError) {
      console.error("Errore upload foto vista:", uploadError);
      setMessage("Upload foto non riuscito. Verifica connessione e permessi.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoUpload(file: File | null) {
    await handlePhotoUploadForVista(vistaAttiva, file);
  }

  async function handleSaveHotspot() {
    if (!pendingPos || !zonaPerPending || !normalizedTarga) return;
    try {
      setSaving(true);
      setMessage(null);
      await saveNextMappaStoricoHotspot({
        targa: normalizedTarga,
        vista: vistaAttiva,
        areaId: zonaPerPending,
        x: pendingPos.x,
        y: pendingPos.y,
      });
      setPendingPos(null);
      setZonaSelezionata(zonaPerPending);
      await reloadSnapshot(`Hotspot salvato su ${getZonaLabel(zonaPerPending)}.`);
    } catch (saveError) {
      console.error("Errore salvataggio hotspot:", saveError);
      setMessage("Salvataggio hotspot non riuscito.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteHotspot(hotspot: NextMappaStoricoHotspotRecord) {
    try {
      setSaving(true);
      setMessage(null);
      await deleteNextMappaStoricoHotspot(hotspot.id);
      await reloadSnapshot(`Hotspot ${getZonaLabel(hotspot.areaId)} rimosso.`);
    } catch (deleteError) {
      console.error("Errore eliminazione hotspot:", deleteError);
      setMessage("Eliminazione hotspot non riuscita.");
    } finally {
      setSaving(false);
    }
  }

  function handleSurfaceClick(event: React.MouseEvent<HTMLDivElement>) {
    if (!modalitaSetup) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setPendingPos({
      x: Math.max(0, Math.min(100, Number(x.toFixed(2)))),
      y: Math.max(0, Math.min(100, Number(y.toFixed(2)))),
    });
  }

  function handlePickIntervento(intervento: NextMappaStoricoIntervento) {
    const firstAreaId = intervento.areaIds[0] ?? null;
    if (firstAreaId) {
      const area = getNextMezzoHotspotAreaById(firstAreaId);
      if (area) {
        setVistaAttiva(area.vista);
        setZonaSelezionata(firstAreaId);
      }
    }
    setModalAperto(null);
  }

  if (!normalizedTarga) {
    return <div className="ms-empty">Seleziona un mezzo per aprire il dettaglio tecnico.</div>;
  }

  if (loading) {
    return <div className="ms-empty">Caricamento dettaglio tecnico in corso...</div>;
  }

  if (error || !snapshot || !vistaSnapshot) {
    return <div className="ms-empty">{error || "Dettaglio tecnico non disponibile."}</div>;
  }

  const hotspotsVisibili = modalitaSetup ? vistaSnapshot.hotspots : vistaSnapshot.hotspotsConStorico;
  const zoneConStoricoNellaVista = vistaSnapshot.aree.filter((area) => area.interventi.length > 0);
  const cronologiaInterventi = zonaDettaglio ? zonaDettaglio.interventi : searchResults;
  const titoliZona = zonaDettaglio
    ? Array.from(new Set(zonaDettaglio.interventi.map((item) => item.title))).slice(0, 4)
    : [];
  const mezzoCardInfo = {
    targa: mezzoInfo?.targa || snapshot.targa,
    mezzoLabel: mezzoInfo?.mezzoLabel || snapshot.mezzoLabel,
    autistaNome: mezzoInfo?.autistaNome ?? null,
    categoria: mezzoInfo?.categoria || snapshot.categoriaLabel,
    kmAttuali:
      mezzoInfo?.kmAttuali != null
        ? String(mezzoInfo.kmAttuali)
        : snapshot.kmUltimoRifornimentoLabel || null,
    ultimaManutenzione: mezzoInfo?.ultimaManutenzione || snapshot.ultimaManutenzioneLabel || null,
    ultimoInterventoMezzo: mezzoInfo?.ultimoInterventoMezzo || null,
    ultimoInterventoCompressore: mezzoInfo?.ultimoInterventoCompressore || null,
    ultimeManutenzioniMezzo: mezzoInfo?.ultimeManutenzioniMezzo ?? [],
    ultimeManutenzioniCompressore: mezzoInfo?.ultimeManutenzioniCompressore ?? [],
  };
  const interventiInVista = zoneConStoricoNellaVista.reduce((sum, area) => sum + area.interventi.length, 0);

  if (photoManager) {
    return (
      <div className="man2-photo-manager">
        {message ? <div className="man2-feedback man2-feedback--notice">{message}</div> : null}
        <div className="man2-photo-grid man2-photo-grid--manager">
          {VISTE.map((vista) => {
            const vistaData = snapshot.viste[vista];
            const vistaNome = formatVistaLabel(vista);
            const hasFoto = Boolean(vistaData.foto);

            return (
              <article key={vista} className="man2-photo-card man2-photo-card--manager">
                <div className="man2-photo-card__head">
                  <span>{vistaNome}</span>
                  <strong>Vista {vistaNome.toLowerCase()}</strong>
                  <small>{hasFoto ? "Preview reale collegata al dettaglio" : "Placeholder finche la foto manca"}</small>
                </div>

                {hasFoto ? (
                  <img
                    src={vistaData.foto?.downloadUrl}
                    alt={`Vista ${vistaNome} ${snapshot.targa}`}
                    className="man2-photo-card__preview"
                  />
                ) : (
                  <div className="man2-photo-card__placeholder">
                    <span>{vistaNome}</span>
                    <strong>Nessuna foto caricata</strong>
                  </div>
                )}

                <label className="man2-photo-card__upload">
                  <span>{hasFoto ? "Sostituisci foto" : "Carica foto"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={saving}
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      void handlePhotoUploadForVista(vista, file);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
              </article>
            );
          })}
        </div>
      </div>
    );
  }

  if (embedded) {
    const canOpenDocument = Boolean(
      selectedLegacyRecord?.sourceDocumentId &&
        selectedLegacyRecord.sourceDocumentFileUrl &&
        onOpenDocument,
    );
    const canDownloadPdf = Boolean(selectedLegacyRecord && onDownloadPdfSingle);

    return (
      <div className="man2-detail-v2__shell">
        {message ? <div className="man2-feedback man2-feedback--notice">{message}</div> : null}

        <div className="man2-detail-v2__split">
          <section className="man2-detail-v2__list-panel">
            <div className="man2-detail-v2__list-header">
              <span className="man2-detail-v2__list-title">Storico manutenzioni</span>
              <span className="man2-detail-v2__list-count">{filterCounts.tutte}</span>
            </div>

            <div className="man2-detail-v2__filters">
              {activeFilters.map((filterKey) => (
                <button
                  key={filterKey}
                  type="button"
                  className={`man2-detail-v2__filter-chip${activeFilter === filterKey ? " is-active" : ""}`}
                  onClick={() => setActiveFilter(filterKey)}
                >
                  {DETAIL_FILTER_LABELS[filterKey]} ({filterCounts[filterKey]})
                </button>
              ))}
            </div>

            <div className="man2-detail-v2__list-scroll">
              {filteredStorico.length === 0 ? (
                <div className="man2-detail-v2__list-empty">
                  {storicoManutenzioni.length === 0
                    ? "Nessuna manutenzione per questo mezzo"
                    : "Nessuna manutenzione per il filtro selezionato"}
                </div>
              ) : (
                filteredStorico.map((item) => {
                  const category = resolveDetailCategory(item);
                  const dateParts = parseLegacyDateParts(item.data);
                  const deltaLabel = formatKmDeltaLabel(
                    currentKmValue != null && item.km != null ? currentKmValue - item.km : null,
                  );
                  const isSelected = selectedRecord?.id === item.id;

                  return (
                    <button
                      key={item.id}
                      id={`man2-detail-v2-row-${item.id}`}
                      type="button"
                      role="button"
                      tabIndex={0}
                      className={`man2-detail-v2__row${isSelected ? " is-selected" : ""}`}
                      onClick={() => onSelectMaintenance?.(isSelected ? null : item.id)}
                    >
                      <div className="man2-detail-v2__row-date">
                        <span>{dateParts.monthYear}</span>
                        <strong>{dateParts.day}</strong>
                      </div>
                      <div className="man2-detail-v2__row-body">
                        <div className="man2-detail-v2__row-title">{formatMaintenanceTitle(item)}</div>
                        <div className="man2-detail-v2__row-sub">
                          {(item.fornitore?.trim() || "—") + " · " + formatMaintenanceMetricInline(item)}
                        </div>
                      </div>
                      <div className="man2-detail-v2__row-right">
                        <span className={`man2-detail-v2__type-pill man2-detail-v2__type-pill--${category}`}>
                          {DETAIL_FILTER_LABELS[category]}
                        </span>
                        {deltaLabel ? <span className="man2-detail-v2__row-delta">{deltaLabel}</span> : null}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </section>

          <section className="man2-detail-v2__detail-panel">
            {!selectedRecord ? (
              <div className="man2-detail-v2__empty-state">
                <div className="man2-detail-v2__empty-icon">📋</div>
                <h3>Seleziona una manutenzione</h3>
                <p>Clicca una voce dalla lista a sinistra per vederne tutti i dettagli.</p>
              </div>
            ) : (
              <>
                <div className="man2-detail-v2__detail-header">
                  <div className="man2-detail-v2__detail-head-top">
                    <h2 className="man2-detail-v2__detail-title">{formatMaintenanceTitle(selectedRecord)}</h2>
                    <div className="man2-detail-v2__actions">
                      <button
                        type="button"
                        className="man2-detail-v2__action man2-detail-v2__action--primary"
                        onClick={() => onEditLatest?.()}
                        aria-label="Modifica la manutenzione selezionata"
                      >
                        Modifica
                      </button>
                      <button
                        type="button"
                        className="man2-detail-v2__action"
                        onClick={() => onOpenDossier?.()}
                        aria-label="Apri il dossier del mezzo selezionato"
                      >
                        Apri dossier
                      </button>
                      <button
                        type="button"
                        className="man2-detail-v2__action"
                        onClick={() => selectedLegacyRecord && onOpenDocument?.(selectedLegacyRecord)}
                        disabled={!canOpenDocument}
                        aria-disabled={!canOpenDocument}
                        aria-label="Apri il documento collegato alla manutenzione"
                      >
                        Apri documento
                      </button>
                      <button
                        type="button"
                        className="man2-detail-v2__action"
                        onClick={() => selectedLegacyRecord && onDownloadPdfSingle?.(selectedLegacyRecord)}
                        disabled={!canDownloadPdf}
                        aria-disabled={!canDownloadPdf}
                        aria-label="Scarica il PDF della manutenzione selezionata"
                      >
                        Scarica PDF
                      </button>
                      <button
                        type="button"
                        className="man2-detail-v2__action man2-detail-v2__action--danger"
                        onClick={() => {
                          if (selectedMaintenance && onDelete) onDelete(selectedMaintenance);
                        }}
                        disabled={!selectedMaintenance || !onDelete}
                        aria-disabled={!selectedMaintenance || !onDelete}
                        aria-label="Elimina definitivamente la manutenzione selezionata"
                      >
                        Elimina
                      </button>
                    </div>
                  </div>
                  <div className="man2-detail-v2__detail-meta">
                    {selectedRecord.data || "DA VERIFICARE"}
                    <span className="man2-detail-v2__detail-meta-sep">·</span>
                    {selectedRecord.sottotipo?.trim() || "—"}
                    <span className="man2-detail-v2__detail-meta-sep">·</span>
                    {selectedRecord.fornitore?.trim() || "Fornitore non indicato"}
                  </div>
                </div>

                <div className="man2-detail-v2__detail-body">
                  <div className="man2-detail-v2__kpi-strip">
                    <div className="man2-detail-v2__kpi-item">
                      <span className="man2-detail-v2__kpi-label">Km intervento</span>
                      <strong className="man2-detail-v2__kpi-value">
                        {selectedRecord.km != null ? `${formatNumberOptional(selectedRecord.km)} km` : "—"}
                      </strong>
                    </div>
                    <div className="man2-detail-v2__kpi-item">
                      <span className="man2-detail-v2__kpi-label">Δ km da oggi</span>
                      <strong
                        className={`man2-detail-v2__kpi-value man2-detail-v2__kpi-value--delta${
                          selectedDeltaKm != null && selectedDeltaKm > 0 ? " is-positive" : ""
                        }`}
                      >
                        {selectedDeltaKm == null ? "—" : selectedDeltaKm > 0 ? `+${formatNumberOptional(selectedDeltaKm)}` : "0"}
                      </strong>
                    </div>
                    <div className="man2-detail-v2__kpi-item">
                      <span className="man2-detail-v2__kpi-label">Importo</span>
                      <strong className="man2-detail-v2__kpi-value">
                        {formatMaintenanceImporto(
                          selectedRecord.importo ?? null,
                          selectedRecord.sourceDocumentCurrency ?? null,
                        )}
                      </strong>
                    </div>
                  </div>

                  <div className="man2-detail-v2__field-grid">
                    <div className="man2-detail-v2__field">
                      <span className="man2-detail-v2__field-label">Tipo intervento</span>
                      <span className="man2-detail-v2__field-value">
                        <span
                          className={`man2-detail-v2__type-pill man2-detail-v2__type-pill--${
                            selectedCategory ?? "mezzo"
                          }`}
                        >
                          {DETAIL_FILTER_LABELS[selectedCategory ?? "mezzo"]}
                        </span>
                      </span>
                    </div>
                    <div className="man2-detail-v2__field">
                      <span className="man2-detail-v2__field-label">Sottotipo</span>
                      <span className={`man2-detail-v2__field-value${selectedRecord.sottotipo ? "" : " is-muted"}`}>
                        {selectedRecord.sottotipo?.trim() || "Non specificato"}
                      </span>
                    </div>
                    <div className="man2-detail-v2__field">
                      <span className="man2-detail-v2__field-label">Fornitore</span>
                      <span className={`man2-detail-v2__field-value${selectedRecord.fornitore ? "" : " is-muted"}`}>
                        {selectedRecord.fornitore?.trim() || "Non indicato"}
                      </span>
                    </div>
                    <div className="man2-detail-v2__field">
                      <span className="man2-detail-v2__field-label">Ore di lavoro</span>
                      <span className={`man2-detail-v2__field-value${selectedRecord.ore != null ? "" : " is-muted"}`}>
                        {selectedRecord.ore != null ? `${formatNumberOptional(selectedRecord.ore)} h` : "Non registrate"}
                      </span>
                    </div>
                  </div>

                  <section className="man2-detail-v2__section">
                    <div className="man2-detail-v2__section-title">Descrizione intervento</div>
                    <div className="man2-detail-v2__description-box">
                      {selectedRecord.descrizione?.trim() || "Nessuna descrizione inserita"}
                    </div>
                  </section>

                  {showTyreSection ? (
                    <section className="man2-detail-v2__section">
                      <div className="man2-detail-v2__section-title">
                        <span>Dettagli intervento gomme</span>
                        {selectedRecord.gommeStraordinario ? (
                          <span className="man2-detail-v2__section-badge man2-detail-v2__section-badge--danger">
                            STRAORDINARIO
                          </span>
                        ) : null}
                      </div>
                      <div className="man2-detail-v2__gomme-box">
                        {selectedAxesNormalized.length > 0 ? (
                          <div className="man2-detail-v2__gomme-row">
                            <span className="man2-detail-v2__gomme-label">Assi coinvolti</span>
                            <div className="man2-detail-v2__gomme-tags">
                              {selectedAxesNormalized.map((asse) => (
                                <span key={asse} className="man2-detail-v2__gomme-tag">
                                  {formatAsseLabel(asse)}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : null}
                        {selectedRecord.gommeInterventoTipo ? (
                          <div className="man2-detail-v2__gomme-row">
                            <span className="man2-detail-v2__gomme-label">Tipo intervento</span>
                            <span className="man2-detail-v2__gomme-value">
                              {selectedRecord.gommeInterventoTipo}
                            </span>
                          </div>
                        ) : null}
                        {(selectedRecord.gommePerAsse ?? []).map((entry) => (
                          <div key={`${entry.asseId}-${entry.dataCambio ?? "nodata"}`} className="man2-detail-v2__gomme-axis">
                            <strong>{formatAsseLabel(entry.asseId)}</strong>
                            <span>Data cambio: {entry.dataCambio || "—"}</span>
                            <span>
                              Km cambio: {entry.kmCambio != null ? formatNumberOptional(entry.kmCambio) : "—"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  <section className="man2-detail-v2__section">
                    <div className="man2-detail-v2__section-title">
                      <span>Materiali / ricambi utilizzati</span>
                      {(selectedRecord.materiali?.length ?? 0) > 0 ? (
                        <span className="man2-detail-v2__section-badge">
                          {selectedRecord.materiali?.length ?? 0}
                        </span>
                      ) : null}
                    </div>
                    {(selectedRecord.materiali?.length ?? 0) > 0 ? (
                      <div className="man2-detail-v2__materials">
                        {(selectedRecord.materiali ?? []).map((materiale) => (
                          <div key={materiale.id} className="man2-detail-v2__material-row">
                            <span className="man2-detail-v2__material-name">{materiale.label}</span>
                            <span className="man2-detail-v2__material-qty">
                              {formatNumberOptional(materiale.quantita)} {materiale.unita}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="man2-detail-v2__empty-block">
                        Nessun materiale registrato per questo intervento
                      </div>
                    )}
                  </section>

                  <section className="man2-detail-v2__section">
                    <div className="man2-detail-v2__section-title">Documento collegato</div>
                    {canOpenDocument && selectedLegacyRecord ? (
                      <button
                        type="button"
                        className="man2-detail-v2__document-link"
                        onClick={() => onOpenDocument?.(selectedLegacyRecord)}
                      >
                        📄 Apri documento originale ({selectedLegacyRecord.sourceDocumentId})
                      </button>
                    ) : (
                      <div className="man2-detail-v2__empty-block">
                        Nessun documento allegato a questa manutenzione
                      </div>
                    )}
                  </section>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    );
  }
  return (
    <div className="ms-shell">
      {message ? <div className="ms-info">{message}</div> : null}

      <div className="ms-layout">
        <div className="ms-card ms-card-panel ms-column ms-column--main">
          <div className="ms-card ms-card-soft ms-views-card">
            <div className="ms-detail-toolbar">
              <div className="ms-card-kicker">Viste mezzo</div>
              <button
                type="button"
                className={`ms-filtro-btn ms-setup-toggle${modalitaSetup ? " is-active" : ""}`}
                onClick={() => setModalitaSetup((current) => !current)}
              >
                {modalitaSetup ? "Chiudi setup" : "Gestisci hotspot"}
              </button>
            </div>
            <div className="ms-viste-tabs">
              {VISTE.map((vista) => (
                <button
                  key={vista}
                  type="button"
                  className={`ms-vista-btn${vistaAttiva === vista ? " is-active" : ""}`}
                  onClick={() => {
                    setVistaAttiva(vista);
                    setPendingPos(null);
                  }}
                >
                  {formatVistaLabel(vista)}
                </button>
              ))}
            </div>
          </div>

          <div className="ms-card ms-photo-card">
            <div className="ms-photo-wrap">
              <div
                className={`ms-surface${modalitaSetup ? " ms-add-cursor" : ""}`}
                onClick={handleSurfaceClick}
              >
                <div className="ms-surface-header">
                  <span className="ms-surface-tag">Vista {vistaLabel}</span>
                  <span className="ms-surface-tag">
                    {vistaSnapshot.foto ? "Foto tecnica presente" : "Placeholder tecnico"}
                  </span>
                </div>

                {vistaSnapshot.foto ? (
                  <img
                    src={vistaSnapshot.foto.downloadUrl}
                    alt={`Vista ${vistaAttiva} ${snapshot.targa}`}
                    className="ms-photo"
                  />
                ) : (
                  <div className="ms-foto-placeholder">
                    <span className="ms-placeholder-badge">Vista {vistaLabel}</span>
                    <strong>Nessuna foto caricata</strong>
                    <span>La mappa resta consultabile anche senza immagine o hotspot.</span>
                  </div>
                )}

                {hotspotsVisibili.map((hotspot) => (
                  <button
                    key={hotspot.id}
                    type="button"
                    className={`${getHotspotClassName(hotspot.areaId)}${zonaSelezionata === hotspot.areaId ? " is-selected" : ""}`}
                    style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
                    onClick={(event) => {
                      event.stopPropagation();
                      setZonaSelezionata(hotspot.areaId);
                    }}
                  >
                    <span className="ms-hotspot-dot" />
                    <span className="ms-hotspot-label">{getZonaLabel(hotspot.areaId)}</span>
                  </button>
                ))}

                {modalitaSetup && pendingPos ? (
                  <div
                    className="ms-hotspot is-pending"
                    style={{ left: `${pendingPos.x}%`, top: `${pendingPos.y}%` }}
                  >
                    <span className="ms-hotspot-dot" />
                    <span className="ms-hotspot-label">Nuovo hotspot</span>
                  </div>
                ) : null}
              </div>

              <div className="ms-legend">
                <span>Hotspot visibili: {hotspotsVisibili.length}</span>
                <span>Zone con storico: {zoneConStoricoNellaVista.length}</span>
                <span>Interventi in vista: {interventiInVista}</span>
                <span>Vista attiva: {vistaLabel}</span>
              </div>
            </div>
          </div>

          {modalitaSetup ? (
            <div className="ms-card ms-card-soft ms-setup-form">
              <div className="ms-card-kicker">Setup hotspot</div>
              <div className="ms-setup-row">
                <label className="ms-field">
                  <span>Carica foto vista {vistaAttiva}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => void handlePhotoUpload(event.target.files?.[0] ?? null)}
                  />
                </label>
                <label className="ms-field">
                  <span>Zona hotspot</span>
                  <select
                    value={zonaPerPending}
                    onChange={(event) => setZonaPerPending(event.target.value)}
                  >
                    {areeSetupDisponibili.map((area) => (
                      <option key={area.id} value={area.id}>
                        {area.label}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="ms-filtro-btn"
                  disabled={!pendingPos || saving}
                  onClick={() => void handleSaveHotspot()}
                >
                  Salva hotspot
                </button>
              </div>

              <div className="ms-setup-hint">
                Clicca sulla foto per posizionare un hotspot, poi assegna la zona tecnica.
              </div>

              {vistaSnapshot.hotspots.length > 0 ? (
                <div className="ms-setup-list">
                  {vistaSnapshot.hotspots.map((hotspot) => (
                    <div key={hotspot.id} className="ms-modal-row">
                      <div>
                        <strong>{getZonaLabel(hotspot.areaId)}</strong>
                        <div className="ms-zona-meta">
                          Posizione: {hotspot.x.toFixed(1)}% - {hotspot.y.toFixed(1)}%
                        </div>
                      </div>
                      <button
                        type="button"
                        className="ms-delete-btn"
                        onClick={() => void handleDeleteHotspot(hotspot)}
                      >
                        Elimina
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <aside className="ms-card ms-card-soft ms-column ms-column--side">
          <div className="ms-detail-summary">
            <div className="ms-card-kicker">Riepilogo mezzo</div>
            <div className="ms-vehicle-grid ms-vehicle-grid--detail">
              <div className="ms-vehicle-item">
                <span className="ms-vehicle-label">Targa</span>
                <strong>{mezzoCardInfo.targa}</strong>
              </div>
              <div className="ms-vehicle-item">
                <span className="ms-vehicle-label">Mezzo / modello</span>
                <strong>{mezzoCardInfo.mezzoLabel}</strong>
              </div>
              <div className="ms-vehicle-item">
                <span className="ms-vehicle-label">Autista solito</span>
                <strong>{mezzoCardInfo.autistaNome || "DA VERIFICARE"}</strong>
              </div>
              <div className="ms-vehicle-item">
                <span className="ms-vehicle-label">Categoria</span>
                <strong>{mezzoCardInfo.categoria || "DA VERIFICARE"}</strong>
              </div>
              <div className="ms-vehicle-item">
                <span className="ms-vehicle-label">Km attuali</span>
                <strong>{mezzoCardInfo.kmAttuali || "DA VERIFICARE"}</strong>
              </div>
              <div className="ms-vehicle-item">
                <span className="ms-vehicle-label">Ultima manutenzione</span>
                <strong>{mezzoCardInfo.ultimaManutenzione || "Nessuna"}</strong>
              </div>
              <div className="ms-vehicle-item">
                <span className="ms-vehicle-label">Ultimo intervento mezzo</span>
                <strong>{mezzoCardInfo.ultimoInterventoMezzo || "Nessuno"}</strong>
              </div>
              <div className="ms-vehicle-item">
                <span className="ms-vehicle-label">Ultimo intervento compressore</span>
                <strong>{mezzoCardInfo.ultimoInterventoCompressore || "Nessuno"}</strong>
              </div>
            </div>

            <div className="ms-detail-quick-actions">
              <button type="button" className="ms-filtro-btn" onClick={() => onOpenDossier?.()}>
                Apri dossier mezzo
              </button>
              <button type="button" className="ms-filtro-btn" onClick={() => onOpenPdf?.()}>
                Apri quadro PDF
              </button>
            </div>

            <div className="ms-card-kicker">Ultime manutenzioni mezzo</div>
            {mezzoCardInfo.ultimeManutenzioniMezzo.length > 0 ? (
              <div className="ms-mini-history">
                {mezzoCardInfo.ultimeManutenzioniMezzo.map((item) => (
                  <div key={item.id} className="ms-mini-history-item">
                    <strong>{item.title}</strong>
                    <span>{item.data}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="ms-empty">Nessuna manutenzione mezzo disponibile.</div>
            )}

            <div className="ms-card-kicker">Ultime manutenzioni compressore</div>
            {mezzoCardInfo.ultimeManutenzioniCompressore.length > 0 ? (
              <div className="ms-mini-history">
                {mezzoCardInfo.ultimeManutenzioniCompressore.map((item) => (
                  <div key={item.id} className="ms-mini-history-item">
                    <strong>{item.title}</strong>
                    <span>{item.data}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="ms-empty">Nessuna manutenzione compressore disponibile.</div>
            )}
          </div>

          <div className="ms-card ms-card-panel">
            <div className="ms-filtri">
              <button type="button" className="ms-filtro-btn" onClick={() => setModalAperto("ultimi")}>
                Ultimi interventi
              </button>
              <button type="button" className="ms-filtro-btn" onClick={() => setModalAperto("frequenti")}>
                Piu frequenti
              </button>
              <button type="button" className="ms-filtro-btn" onClick={() => setModalAperto("perzona")}>
                Per zona
              </button>
            </div>
          </div>

          <div className="ms-card ms-card-panel ms-zone-panel">
            <div className="ms-card-kicker">Dettaglio zona</div>
            <div className="ms-zone-head">
              <div className="ms-zona-title">
                {zonaDettaglio ? zonaDettaglio.label : "Nessuna zona selezionata"}
              </div>
              <span className={`ms-zone-badge${zonaDettaglio?.interventi.length ? " is-positive" : ""}`}>
                {zonaDettaglio
                  ? zonaDettaglio.interventi.length > 0
                    ? "Storico presente"
                    : "Nessuno storico"
                  : "Seleziona hotspot o risultato"}
              </span>
            </div>

            <div className="ms-zone-stats">
              <div className="ms-zone-stat">
                <span>Vista</span>
                <strong>{zonaDettaglio ? formatVistaLabel(zonaDettaglio.vista) : vistaLabel}</strong>
              </div>
              <div className="ms-zone-stat">
                <span>Interventi</span>
                <strong>{zonaDettaglio ? zonaDettaglio.interventi.length : searchResults.length}</strong>
              </div>
              <div className="ms-zone-stat">
                <span>Ultima data</span>
                <strong>{zonaDettaglio?.interventi[0]?.dataLabel || snapshot.ultimaManutenzioneLabel || "Nessuna"}</strong>
              </div>
              <div className="ms-zone-stat">
                <span>Zone mappate</span>
                <strong>{tutteLeZone.filter((zona) => zona.hotspots.length > 0).length}</strong>
              </div>
            </div>

            {zonaDettaglio ? (
              <>
                <div className="ms-zone-summary">{zonaDettaglio.description}</div>
                {titoliZona.length > 0 ? (
                  <div className="ms-zone-tags">
                    {titoliZona.map((titolo) => (
                      <span key={titolo} className="ms-zone-tag">
                        {titolo}
                      </span>
                    ))}
                  </div>
                ) : null}
              </>
            ) : (
              <div className="ms-zone-summary">
                Seleziona un hotspot oppure usa ricerca e filtri per portare il pannello sulla zona corretta.
              </div>
            )}
          </div>

          <div className="ms-card ms-card-panel">
            <div className="ms-list-header">
              <div>
                <div className="ms-card-kicker">Storico cronologico</div>
                <div className="ms-list-title">
                  {zonaDettaglio ? "Interventi della zona" : "Risultati ricerca / storico"}
                </div>
              </div>
              <span className="ms-list-counter">{cronologiaInterventi.length} elementi</span>
            </div>

            {cronologiaInterventi.length === 0 ? (
              <div className="ms-empty">
                {zonaDettaglio
                  ? "Nessuno storico associato a questa zona."
                  : "Nessun intervento trovato con i filtri attuali."}
              </div>
            ) : (
              <div className="ms-interventi">
                {cronologiaInterventi.map((intervento) => (
                  <button
                    key={intervento.id}
                    type="button"
                    className={`ms-intervento-row${zonaDettaglio ? "" : " is-clickable"}`}
                    onClick={
                      zonaDettaglio
                        ? undefined
                        : () => handlePickIntervento(intervento)
                    }
                  >
                    <div className="ms-intervento-topline">
                      <div className="ms-intervento-title">{intervento.title}</div>
                      <span className="ms-intervento-kind">
                        {intervento.sourceKind === "gomme" ? "Gomme" : "Manutenzione"}
                      </span>
                    </div>
                    <div className="ms-intervento-meta">{formatInterventoMeta(intervento)}</div>
                    <div className="ms-intervento-text">{intervento.descrizione}</div>
                    <div className="ms-zona-meta">
                      {intervento.areaLabels.length > 0
                        ? `Zone: ${intervento.areaLabels.join(", ")}`
                        : "Zona non deducibile"}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {snapshot.limitations.length > 0 ? (
            <div className="ms-card ms-card-soft ms-notes-card">
              <div className="ms-card-kicker">Note dati</div>
              <div className="ms-limitations">
                {snapshot.limitations.map((item) => (
                  <div key={item} className="ms-limit-item">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </aside>
      </div>

      {modalAperto ? (
        <div className="ms-modal-overlay" onClick={() => setModalAperto(null)}>
          <div className="ms-modal" onClick={(event) => event.stopPropagation()}>
            <div className="ms-modal-header">
              <strong>
                {modalAperto === "ultimi"
                  ? "Ultimi interventi"
                  : modalAperto === "frequenti"
                  ? "Zone piu frequenti"
                  : "Interventi per zona"}
              </strong>
              <button type="button" className="ms-delete-btn" onClick={() => setModalAperto(null)}>
                Chiudi
              </button>
            </div>

            {modalAperto === "ultimi" ? (
              <div className="ms-modal-body">
                {snapshot.interventi.slice(0, 12).map((intervento) => (
                  <button
                    key={intervento.id}
                    type="button"
                    className="ms-modal-row is-clickable"
                    onClick={() => handlePickIntervento(intervento)}
                  >
                    <div>
                      <strong>{intervento.title}</strong>
                      <div className="ms-zona-meta">{formatInterventoMeta(intervento)}</div>
                    </div>
                    <span>{intervento.areaLabels[0] || "Apri dettaglio"}</span>
                  </button>
                ))}
              </div>
            ) : null}

            {modalAperto === "frequenti" ? (
              <div className="ms-modal-body">
                {frequenzaZone.map((zona) => (
                  <button
                    key={zona.areaId}
                    type="button"
                    className="ms-modal-row is-clickable"
                    onClick={() => {
                      setVistaAttiva(zona.vista);
                      setZonaSelezionata(zona.areaId);
                      setModalAperto(null);
                    }}
                  >
                    <div>
                      <strong>{zona.label}</strong>
                      <div className="ms-zona-meta">
                        Vista: {zona.vista} - Interventi: {zona.interventi.length}
                      </div>
                    </div>
                    <span>Apri zona</span>
                  </button>
                ))}
              </div>
            ) : null}

            {modalAperto === "perzona" ? (
              <div className="ms-modal-body">
                {tutteLeZone.map((zona) => (
                  <button
                    key={zona.areaId}
                    type="button"
                    className="ms-modal-row is-clickable"
                    onClick={() => {
                      setVistaAttiva(zona.vista);
                      setZonaSelezionata(zona.areaId);
                      setModalAperto(null);
                    }}
                  >
                    <div>
                      <strong>{zona.label}</strong>
                      <div className="ms-zona-meta">{zona.description}</div>
                    </div>
                    <span>{zona.interventi.length} interventi</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
