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
  getNextMezzoHotspotAreaById,
  getNextMezzoHotspotAreasByVista,
  type NextMappaStoricoVista,
} from "./mezziHotspotAreas";
import "./next-mappa-storico.css";

type NextMappaStoricoPageProps = {
  targa: string;
};

type ModalKind = "ultimi" | "frequenti" | "perzona" | null;

const VISTE: NextMappaStoricoVista[] = ["fronte", "sinistra", "destra", "retro"];

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

export default function NextMappaStoricoPage({ targa }: NextMappaStoricoPageProps) {
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
  const [searchQuery, setSearchQuery] = useState("");
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
        setError("Impossibile caricare la vista Mappa storico del mezzo selezionato.");
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

  async function handlePhotoUpload(file: File | null) {
    if (!file || !normalizedTarga) return;
    try {
      setSaving(true);
      setMessage(null);
      await uploadNextMappaStoricoPhoto({
        targa: normalizedTarga,
        vista: vistaAttiva,
        file,
      });
      await reloadSnapshot(`Foto ${vistaAttiva} aggiornata.`);
    } catch (uploadError) {
      console.error("Errore upload foto vista:", uploadError);
      setMessage("Upload foto non riuscito. Verifica connessione e permessi.");
    } finally {
      setSaving(false);
    }
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
    return <div className="ms-empty">Seleziona un mezzo per aprire la mappa storico.</div>;
  }

  if (loading) {
    return <div className="ms-empty">Caricamento mappa storico in corso...</div>;
  }

  if (error || !snapshot || !vistaSnapshot) {
    return <div className="ms-empty">{error || "Mappa storico non disponibile."}</div>;
  }

  const hotspotsVisibili = modalitaSetup ? vistaSnapshot.hotspots : vistaSnapshot.hotspotsConStorico;
  const zoneConStoricoNellaVista = vistaSnapshot.aree.filter((area) => area.interventi.length > 0);
  const cronologiaInterventi = zonaDettaglio ? zonaDettaglio.interventi : searchResults;
  const titoliZona = zonaDettaglio
    ? Array.from(new Set(zonaDettaglio.interventi.map((item) => item.title))).slice(0, 4)
    : [];

  return (
    <div className="ms-shell">
      <div className="ms-topbar">
        <div className="ms-topbar-main">
          <span className="ms-eyebrow">Vista tecnica mezzo</span>
          <div className="ms-mezzo-targa">{snapshot.mezzoLabel}</div>
          <div className="ms-mezzo-meta">
            <span>{snapshot.categoriaLabel}</span>
            <span>{snapshot.tipoMezzoLabel}</span>
            {snapshot.showKmUltimoRifornimento ? (
              <span>
                Km ultimo rifornimento: {snapshot.kmUltimoRifornimentoLabel || "DA VERIFICARE"}
              </span>
            ) : null}
            <span>Ultima manutenzione: {snapshot.ultimaManutenzioneLabel || "Nessuna"}</span>
            <span>Interventi totali: {snapshot.totaleInterventi}</span>
          </div>
        </div>

        <div className="ms-topbar-side">
          <button
            type="button"
            className={`ms-filtro-btn ms-setup-toggle${modalitaSetup ? " is-active" : ""}`}
            onClick={() => setModalitaSetup((current) => !current)}
          >
            {modalitaSetup ? "Chiudi setup" : "Gestisci hotspot"}
          </button>
          <div className="ms-topbar-stats">
            <div className="ms-stat-chip">
              <span>Vista attiva</span>
              <strong>{vistaLabel}</strong>
            </div>
            <div className="ms-stat-chip">
              <span>Zone attive</span>
              <strong>{zoneConStoricoNellaVista.length}</strong>
            </div>
            <div className="ms-stat-chip">
              <span>Hotspot visibili</span>
              <strong>{hotspotsVisibili.length}</strong>
            </div>
          </div>
        </div>
      </div>

      {message ? <div className="ms-info">{message}</div> : null}

      <div className="ms-layout">
        <div className="ms-column">
          <div className="ms-card ms-card-soft ms-vehicle-card">
            <div className="ms-card-kicker">Scheda mezzo</div>
            <div className="ms-vehicle-grid">
              <div className="ms-vehicle-item">
                <span className="ms-vehicle-label">Targa</span>
                <strong>{snapshot.targa}</strong>
              </div>
              <div className="ms-vehicle-item">
                <span className="ms-vehicle-label">Categoria</span>
                <strong>{snapshot.categoriaLabel}</strong>
              </div>
              <div className="ms-vehicle-item">
                <span className="ms-vehicle-label">Vista tecnica</span>
                <strong>{vistaLabel}</strong>
              </div>
              <div className="ms-vehicle-item">
                <span className="ms-vehicle-label">Storico vista</span>
                <strong>{zoneConStoricoNellaVista.length} zone</strong>
              </div>
            </div>
          </div>

          <div className="ms-card ms-card-soft ms-views-card">
            <div className="ms-card-kicker">Viste mezzo</div>
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
                    className={`ms-hotspot${zonaSelezionata === hotspot.areaId ? " is-selected" : ""}`}
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
                <span>Interventi in vista: {zoneConStoricoNellaVista.reduce((sum, area) => sum + area.interventi.length, 0)}</span>
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

        <div className="ms-column">
          <div className="ms-card ms-card-panel">
            <div className="ms-filtri">
              <input
                className="ms-search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Cerca per intervento, nota o zona..."
              />
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
        </div>
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
