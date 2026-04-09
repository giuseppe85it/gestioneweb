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
import {
  normalizeNextAssiCoinvolti,
  resolveNextManutenzioneTechnicalView,
} from "./domain/nextManutenzioniGommeDomain";
import {
  getNextMezzoHotspotAreaById,
  getNextMezzoHotspotTargetKindById,
  getNextMezzoHotspotAreasByVista,
  type NextMappaStoricoVista,
} from "./mezziHotspotAreas";
import "./next-mappa-storico.css";

type NextMappaStoricoPageProps = {
  targa: string;
  embedded?: boolean;
  photoManager?: boolean;
  selectedMaintenance?: {
    id: string;
    data: string | null;
    descrizione: string | null;
    assiCoinvolti: string[];
    km: number | null;
    tipo: string | null;
  } | null;
  mezzoInfo?: {
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
  onOpenPdf?: () => void;
  onOpenDossier?: () => void;
  onEditLatest?: () => void;
  onSelectMaintenance?: (recordId: string) => void;
};

type ModalKind = "ultimi" | "frequenti" | "perzona" | null;

const VISTE: NextMappaStoricoVista[] = ["fronte", "sinistra", "destra", "retro"];
const DETAIL_VISTE: NextMappaStoricoVista[] = ["sinistra", "destra"];

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

function formatNumberIt(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return "DA VERIFICARE";
  return new Intl.NumberFormat("it-IT").format(value);
}

function isTyreMaintenanceRecord(record: NextMappaStoricoPageProps["selectedMaintenance"]): boolean {
  if (!record) return false;
  if ((record.assiCoinvolti?.length ?? 0) > 0) return true;
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
  onOpenPdf,
  onOpenDossier,
  onEditLatest,
  onSelectMaintenance,
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
  const highlightedAssiNormalized = useMemo(
    () => normalizeNextAssiCoinvolti(selectedMaintenance?.assiCoinvolti ?? []),
    [selectedMaintenance],
  );
  const selectedMaintenanceIsTyre = useMemo(
    () => isTyreMaintenanceRecord(selectedMaintenance),
    [selectedMaintenance],
  );
  const kmPercorsiDalCambio = useMemo(() => {
    const kmAttuali = mezzoInfo?.kmAttuali ?? null;
    if (kmAttuali == null) return null;
    // Se il record selezionato è gomme, usa il suo km
    if (selectedMaintenanceIsTyre) {
      const kmCambio = selectedMaintenance?.km ?? null;
      if (kmCambio == null) return null;
      const delta = kmAttuali - kmCambio;
      return delta >= 0 ? delta : null;
    }
    // Fallback: usa il km del cambio gomme più recente passato dal parent
    const kmCambioLatest = mezzoInfo?.latestGommeKmCambio ?? null;
    if (kmCambioLatest == null) return null;
    const delta = kmAttuali - kmCambioLatest;
    return delta >= 0 ? delta : null;
  }, [mezzoInfo?.kmAttuali, mezzoInfo?.latestGommeKmCambio, selectedMaintenance, selectedMaintenanceIsTyre]);


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
  const selectedMaintenanceDescription = selectedMaintenance?.descrizione?.trim() || null;
  const selectedMaintenanceType = selectedMaintenance?.tipo?.trim() || null;
  const selectedMaintenanceAxesLabel = highlightedAssiNormalized.length > 0
    ? highlightedAssiNormalized.join(", ")
    : null;
  const technicalView =
    embedded &&
    (vistaAttiva === "sinistra" || vistaAttiva === "destra") &&
    (mezzoInfo?.categoria || snapshot?.categoriaLabel)
      ? resolveNextManutenzioneTechnicalView(mezzoInfo?.categoria || snapshot?.categoriaLabel, vistaAttiva)
      : null;
  const viewerImageSrc = technicalView?.backgroundImage ?? vistaSnapshot?.foto?.downloadUrl ?? null;
  const viewerSourceLabel = technicalView ? "Schema tecnico" : vistaSnapshot?.foto ? "Foto mezzo" : "Anteprima non disponibile";

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
    return (
      <div className="man2-detail-shell">
        {message ? <div className="man2-feedback man2-feedback--notice">{message}</div> : null}

        <div className="man2-detail-layout">
          <section className="man2-detail-card man2-detail-card--main">
            <div className="man2-detail-toolbar">
              <div className="man2-detail-pills">
                <span className="man2-detail-pill">Vista {vistaLabel}</span>
                <span className="man2-detail-pill">
                  {selectedMaintenance?.data ? `Manutenzione ${selectedMaintenance.data}` : "Nessuna manutenzione selezionata"}
                </span>
              </div>
            </div>

            <div className="man2-viste-tabs">
              {DETAIL_VISTE.map((vista) => (
                <button
                  key={vista}
                  type="button"
                  className={`man2-vista-btn${vistaAttiva === vista ? " active" : ""}`}
                  onClick={() => {
                    setVistaAttiva(vista);
                    setPendingPos(null);
                  }}
                  title={`Mostra la vista tecnica ${formatVistaLabel(vista).toLowerCase()} del mezzo.`}
                  aria-label={`Vista ${formatVistaLabel(vista)}`}
                >
                  {formatVistaLabel(vista)}
                </button>
              ))}
            </div>

            <section className="man2-detail-selected">
              <div className="man2-section-title">Manutenzione selezionata</div>
              {selectedMaintenance ? (
                <div className="man2-detail-selected__grid">
                  <div className="man2-detail-selected__item">
                    <span>Data</span>
                    <strong>{selectedMaintenance.data || "DA VERIFICARE"}</strong>
                  </div>
                  <div className="man2-detail-selected__item">
                    <span>Tipo</span>
                    <strong>{selectedMaintenanceType || "DA VERIFICARE"}</strong>
                  </div>
                  <div className="man2-detail-selected__item">
                    <span>Assi coinvolti</span>
                    <strong>{selectedMaintenanceAxesLabel || "Nessuno specificato"}</strong>
                  </div>
                  <div className="man2-detail-selected__item">
                    <span>Km del record</span>
                    <strong>{selectedMaintenance.km !== null ? formatNumberIt(selectedMaintenance.km) : "DA VERIFICARE"}</strong>
                  </div>
                  <div className="man2-detail-selected__item man2-detail-selected__item--full">
                    <span>Dettaglio intervento</span>
                    <strong>{selectedMaintenanceDescription || "Nessun dettaglio disponibile"}</strong>
                  </div>
                </div>
              ) : (
                <div className="man2-detail-selected__empty">
                  Seleziona una manutenzione a destra.
                </div>
              )}
            </section>

            {viewerImageSrc ? (
              <div className="man2-detail-surface man2-detail-surface--viewer">
                <div className="ms-surface man2-detail-surface__static">
                  <div className="ms-surface-header">
                    <span className="ms-surface-tag">Vista {vistaLabel}</span>
                    <span className="ms-surface-tag">{viewerSourceLabel}</span>
                  </div>
                  <img
                    src={viewerImageSrc}
                    alt={`Vista ${vistaAttiva} ${snapshot.targa}`}
                    className="ms-photo man2-detail-viewer-image"
                    title={viewerSourceLabel}
                  />
                </div>
              </div>
            ) : (
              <div className="man2-foto-placeholder">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M4 7h4l2-2h4l2 2h4v10H4V7Z" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                <span>Nessuna foto caricata per la vista {vistaLabel}</span>
              </div>
            )}

            <div className="man2-detail-kpis">
              <div className="man2-detail-kpi">
                <span>Vista attiva</span>
                <strong>{vistaLabel}</strong>
              </div>
              <div className="man2-detail-kpi">
                <span>Record selezionato</span>
                <strong>{selectedMaintenance?.data || "Nessuno"}</strong>
              </div>
              <div className="man2-detail-kpi">
                <span>Storico totale</span>
                <strong>{snapshot.interventi.length}</strong>
              </div>
            </div>
          </section>

          <aside className="man2-detail-card man2-detail-card--side">
            <div className="man2-detail-sidehead">
              <div className="man2-panel-kicker">Dettaglio mezzo</div>
              <h3>{mezzoCardInfo.targa}</h3>
              <p>{mezzoCardInfo.mezzoLabel}</p>
            </div>

            <div className="man2-detail-info-list">
              <div className="man2-detail-info">
                <span>Autista solito</span>
                <strong>{mezzoCardInfo.autistaNome || "DA VERIFICARE"}</strong>
              </div>
              <div className="man2-detail-info">
                <span>Categoria</span>
                <strong>{mezzoCardInfo.categoria || "DA VERIFICARE"}</strong>
              </div>
              <div className="man2-detail-info">
                <span>Km attuali</span>
                <strong>{mezzoCardInfo.kmAttuali || "DA VERIFICARE"}</strong>
              </div>
              {kmPercorsiDalCambio != null ? (
                <div className="man2-detail-info">
                  <span>Km dal cambio gomme</span>
                  <strong>{formatNumberIt(kmPercorsiDalCambio)}</strong>
                </div>
              ) : null}
              <div className="man2-detail-info">
                <span>Ultima manutenzione</span>
                <strong>{mezzoCardInfo.ultimaManutenzione || "Nessuna"}</strong>
              </div>
              <div className="man2-detail-info">
                <span>Ultimo intervento mezzo</span>
                <strong>{mezzoCardInfo.ultimoInterventoMezzo || "Nessuno"}</strong>
              </div>
              <div className="man2-detail-info">
                <span>Ultimo intervento compressore</span>
                <strong>{mezzoCardInfo.ultimoInterventoCompressore || "Nessuno"}</strong>
              </div>
            </div>

            <div className="man2-detail-history-block">
              <div className="man2-section-title">Ultime manutenzioni mezzo</div>
              {mezzoCardInfo.ultimeManutenzioniMezzo.length > 0 ? (
                <div className="man2-detail-history-list">
                  {mezzoCardInfo.ultimeManutenzioniMezzo.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`man2-detail-history-item${selectedMaintenance?.id === item.id ? " is-active" : ""}`}
                      onClick={() => onSelectMaintenance?.(item.id)}
                    >
                      <strong>{item.title}</strong>
                      <span>{item.data}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="ms-empty">Nessuna manutenzione mezzo disponibile.</div>
              )}
            </div>

            <div className="man2-detail-history-block">
              <div className="man2-section-title">Ultime manutenzioni compressore</div>
              {mezzoCardInfo.ultimeManutenzioniCompressore.length > 0 ? (
                <div className="man2-detail-history-list">
                  {mezzoCardInfo.ultimeManutenzioniCompressore.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`man2-detail-history-item${selectedMaintenance?.id === item.id ? " is-active" : ""}`}
                      onClick={() => onSelectMaintenance?.(item.id)}
                    >
                      <strong>{item.title}</strong>
                      <span>{item.data}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="ms-empty">Nessuna manutenzione compressore disponibile.</div>
              )}
            </div>

            <div className="man2-detail-actions">
              <button type="button" className="man2-btn" onClick={() => onOpenDossier?.()}>
                Apri dossier mezzo
              </button>
              <button type="button" className="man2-btn" onClick={() => onOpenPdf?.()}>
                Apri quadro PDF
              </button>
              <button type="button" className="man2-btn man2-btn--secondary" onClick={() => onEditLatest?.()}>
                Modifica manutenzione aperta
              </button>
            </div>
          </aside>
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
