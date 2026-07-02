// Satellite del modulo Manutenzioni: tab "Da fare" (segnalazioni aperte,
// controlli KO aperti, manutenzioni operative). Vista spostata 1:1 da
// NextManutenzioniPage.tsx (regola "moduli a satelliti"): la logica (handler,
// stati, memo) resta nella madre e arriva qui come proprietà.
import type { Dispatch, SetStateAction } from "react";
import type { NextManutenzioniLegacyDatasetRecord } from "../domain/nextManutenzioniDomain";
import type {
  NextAutistiControlloSectionItem,
  NextAutistiSegnalazioneSectionItem,
} from "../domain/nextAutistiDomain";
import { toDisplay } from "../helpers/dateUnica";
import { recordChiusoFromRaw } from "../helpers/frasestoriaRecord";
import { FraseStoriaRecord } from "../components/FraseStoriaRecord";
import {
  buildChiusuraDaEventoTitle,
  buildDescrizioneSnippet,
  COLLEGATA_BADGE_STYLE,
  controlloKoDisplayTarga,
  formatDaFareDateLabel,
  formatGruppoManutenzioneLabel,
  formatMaintenanceOrigineLabel,
  formatMaintenanceStatoLabel,
  formatSegnalazioneAutore,
  formatSegnalazioneDateLabel,
  getMaintenanceStatoBadgeStyle,
  normalizeText,
  resolveMaintenanceOrigine,
  resolveMaintenanceStato,
  resolveMaintenanceUrgenza,
  URGENZA_BADGE_STYLE,
  type ControlliKoDaFareTargaGroup,
  type DaFareOrigineFilter,
  type DaFareUrgenzaFilter,
  type LavoroGruppoRetryState,
  type ManutenzioniDaFareGroup,
  type ManutenzioniOperativeGrouped,
  type SegnalazioniDaFareGroup,
  type SegnalazioniDaFareTargaGroup,
} from "./manutenzioniCondivisi";

export type DaFareTabProps = {
  saving: boolean;
  gruppoManutenzioneBusyKey: string | null;
  controlloKoMenuId: string | null;
  setControlloKoMenuId: Dispatch<SetStateAction<string | null>>;
  segnalazioneMenuId: string | null;
  setSegnalazioneMenuId: Dispatch<SetStateAction<string | null>>;
  daFareMenuId: string | null;
  setDaFareMenuId: Dispatch<SetStateAction<string | null>>;
  daFareUrgenzaFilter: DaFareUrgenzaFilter;
  setDaFareUrgenzaFilter: Dispatch<SetStateAction<DaFareUrgenzaFilter>>;
  daFareOrigineFilter: DaFareOrigineFilter;
  setDaFareOrigineFilter: Dispatch<SetStateAction<DaFareOrigineFilter>>;
  segnalazioniDaFareExpanded: boolean;
  setSegnalazioniDaFareExpanded: Dispatch<SetStateAction<boolean>>;
  controlliKoDaFareExpanded: boolean;
  setControlliKoDaFareExpanded: Dispatch<SetStateAction<boolean>>;
  lavoroGruppoRetryState: LavoroGruppoRetryState | null;
  selectedSegnalazioneIds: string[];
  selectedGruppoSegnalazioneIds: Record<string, string[]>;
  selectedManutenzioneLiberaIds: string[];
  segnalazioniEleggibili: NextAutistiSegnalazioneSectionItem[];
  segnalazioniDaFareByTarga: SegnalazioniDaFareTargaGroup[];
  controlliKoEleggibili: NextAutistiControlloSectionItem[];
  controlliKoDaFareByTarga: ControlliKoDaFareTargaGroup[];
  manutenzioniOperativeFiltrate: NextManutenzioniLegacyDatasetRecord[];
  manutenzioniOperativeGrouped: ManutenzioniOperativeGrouped;
  resolveSourceRecordsForItem: (item: Record<string, unknown>) => Record<string, unknown>[];
  handleRetryAggancioLavoroGruppo: () => Promise<void>;
  handleCreaLavoroDaGruppo: (gruppo: SegnalazioniDaFareGroup) => Promise<void>;
  toggleGruppoSegnalazioneSelection: (groupKey: string, id: string) => void;
  toggleSegnalazioneLiberaSelection: (id: string) => void;
  toggleManutenzioneLiberaSelection: (id: string) => void;
  handleRimuoviDaGruppo: (groupKey: string, segnalazioneId: string) => Promise<void>;
  handleOpenAgganciaSegnalazione: (item: NextAutistiSegnalazioneSectionItem) => Promise<void>;
  handleDeleteSegnalazione: (item: NextAutistiSegnalazioneSectionItem) => Promise<void>;
  handleOpenCreaManutenzioneSegnalazione: (item: NextAutistiSegnalazioneSectionItem) => Promise<void>;
  handleCreaGruppoSegnalazioni: (targaValue: string, segnalazioneIds: string[]) => Promise<void>;
  handleAggiungiAGruppo: (
    gruppoId: string | null,
    targaValue: string,
    segnalazioneIds: string[],
  ) => Promise<void>;
  handleCreaManutenzioneDaControllo: (item: NextAutistiControlloSectionItem) => Promise<void>;
  handleOpenAgganciaControllo: (item: NextAutistiControlloSectionItem) => Promise<void>;
  handleDeleteControllo: (item: NextAutistiControlloSectionItem) => Promise<void>;
  handleCompleteDaFare: (item: NextManutenzioniLegacyDatasetRecord) => void;
  handleAggiungiAGruppoManutenzioni: (
    gruppoId: string,
    targaValue: string,
    manutenzioneIds: string[],
  ) => Promise<void>;
  handleCreaGruppoManutenzioni: (targaValue: string, manutenzioneIds: string[]) => Promise<void>;
  handleRimuoviDaGruppoManutenzioni: (groupKey: string, manutenzioneId: string) => Promise<void>;
  handleEdit: (item: NextManutenzioniLegacyDatasetRecord) => void;
  handleOpenAgganciaUniversale: (item: NextManutenzioniLegacyDatasetRecord) => Promise<void>;
  openDetailForRecord: (item: NextManutenzioniLegacyDatasetRecord) => void;
};

export function DaFareTab(props: DaFareTabProps) {
  const {
    saving,
    gruppoManutenzioneBusyKey,
    controlloKoMenuId,
    setControlloKoMenuId,
    segnalazioneMenuId,
    setSegnalazioneMenuId,
    daFareMenuId,
    setDaFareMenuId,
    daFareUrgenzaFilter,
    setDaFareUrgenzaFilter,
    daFareOrigineFilter,
    setDaFareOrigineFilter,
    segnalazioniDaFareExpanded,
    setSegnalazioniDaFareExpanded,
    controlliKoDaFareExpanded,
    setControlliKoDaFareExpanded,
    lavoroGruppoRetryState,
    selectedSegnalazioneIds,
    selectedGruppoSegnalazioneIds,
    selectedManutenzioneLiberaIds,
    segnalazioniEleggibili,
    segnalazioniDaFareByTarga,
    controlliKoEleggibili,
    controlliKoDaFareByTarga,
    manutenzioniOperativeFiltrate,
    manutenzioniOperativeGrouped,
    resolveSourceRecordsForItem,
    handleRetryAggancioLavoroGruppo,
    handleCreaLavoroDaGruppo,
    toggleGruppoSegnalazioneSelection,
    toggleSegnalazioneLiberaSelection,
    toggleManutenzioneLiberaSelection,
    handleRimuoviDaGruppo,
    handleOpenAgganciaSegnalazione,
    handleDeleteSegnalazione,
    handleOpenCreaManutenzioneSegnalazione,
    handleCreaGruppoSegnalazioni,
    handleAggiungiAGruppo,
    handleCreaManutenzioneDaControllo,
    handleOpenAgganciaControllo,
    handleDeleteControllo,
    handleCompleteDaFare,
    handleAggiungiAGruppoManutenzioni,
    handleCreaGruppoManutenzioni,
    handleRimuoviDaGruppoManutenzioni,
    handleEdit,
    handleOpenAgganciaUniversale,
    openDetailForRecord,
  } = props;

  function renderControlloKoCard(item: NextAutistiControlloSectionItem) {
    const koLabel = item.koList.length > 0 ? `KO: ${item.koList.join(", ")}` : "Controllo KO";
    const title = item.note ? `${koLabel} - ${item.note}` : koLabel;
    const menuId = `controllo-ko:${item.id}`;
    const dateLabel = item.timestamp ? toDisplay(item.timestamp) : "";
    return (
      <article key={item.id} className="man2-last-item man2-dafare-item">
        <div className="man2-dafare-item__main">
          <span className="man2-dafare-item__check-spacer" aria-hidden="true" />
          <div className="man2-dafare-item__content">
            <div className="man2-dafare-item__title-row">
              <span className="man2-dafare-item__title">{buildDescrizioneSnippet(title, 96)}</span>
              {dateLabel ? (
                <span className="man2-dafare-date-chip">Controllo {dateLabel}</span>
              ) : null}
            </div>
            <div className="man2-dafare-item__meta">
              <span>{controlloKoDisplayTarga(item)}</span>
              {item.autistaNome ? <span>Autista {item.autistaNome}</span> : null}
              {item.badgeAutista ? <span>Badge {item.badgeAutista}</span> : null}
            </div>
            <div className="man2-dafare-item__badges">
              <span className="man2-badge man2-dafare-badge--origin">Controllo KO</span>
              {item.koList.map((ko) => (
                <span key={ko} className="man2-badge">
                  {ko}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="man2-form-actions man2-form-actions--row man2-dafare-item__actions">
          <button
            type="button"
            className="man2-btn-full"
            disabled={saving}
            onClick={() => void handleCreaManutenzioneDaControllo(item)}
          >
            Crea manutenzione (Da fare)
          </button>
          <div className="man2-row-menu man2-row-menu--side">
            <button
              type="button"
              className="man2-row-menu__trigger"
              aria-label={`Altre azioni controllo ${title}`}
              aria-expanded={controlloKoMenuId === menuId}
              onClick={() =>
                setControlloKoMenuId((current) => (current === menuId ? null : menuId))
              }
            >
              ⋮
            </button>
            {controlloKoMenuId === menuId ? (
              <div className="man2-row-menu__panel" role="menu">
                <button
                  type="button"
                  className="man2-row-menu__item"
                  role="menuitem"
                  onClick={() => {
                    setControlloKoMenuId(null);
                    void handleOpenAgganciaControllo(item);
                  }}
                >
                  Collega a manutenzione…
                </button>
                <button
                  type="button"
                  className="man2-row-menu__item"
                  role="menuitem"
                  onClick={() => {
                    setControlloKoMenuId(null);
                    void handleDeleteControllo(item);
                  }}
                >
                  Elimina controllo
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </article>
    );
  }

  function renderSegnalazioneCard(
    item: NextAutistiSegnalazioneSectionItem,
    opts?: {
      checkbox?: { checked: boolean; onToggle: () => void };
      menuItems?: { label: string; onClick: () => void; danger?: boolean }[];
    },
  ) {
    const title =
      item.descrizione && item.descrizione !== "-"
        ? item.descrizione
        : "(senza descrizione)";
    const menuId = `segnalazione-card:${item.id}`;
    const checkbox = opts?.checkbox;
    const menuItems = opts?.menuItems ?? [
      {
        label: "Collega a manutenzione…",
        onClick: () => void handleOpenAgganciaSegnalazione(item),
      },
      {
        label: "Elimina segnalazione",
        danger: true,
        onClick: () => void handleDeleteSegnalazione(item),
      },
    ];
    return (
      <article
        key={item.id}
        className={`man2-last-item man2-dafare-item${checkbox?.checked ? " is-selected" : ""}`}
      >
        <div className="man2-dafare-item__main">
          {checkbox ? (
            <input
              type="checkbox"
              className="man2-dafare-item__check"
              checked={checkbox.checked}
              disabled={saving}
              onChange={checkbox.onToggle}
              aria-label={`Seleziona segnalazione ${title}`}
            />
          ) : (
            <span className="man2-dafare-item__check-spacer" aria-hidden="true" />
          )}
          <div className="man2-dafare-item__content">
            <div className="man2-dafare-item__title-row">
              <span className="man2-dafare-item__targa">{normalizeText(item.targa ?? "") || "—"}</span>
              <span className="man2-dafare-item__title">{buildDescrizioneSnippet(title, 96)}</span>
            </div>
            <div className="man2-dafare-item__info">
              Segnalato da <strong>{formatSegnalazioneAutore(item)}</strong>
              {item.timestamp ? <span className="man2-dafare-item__info-when"> · {formatSegnalazioneDateLabel(item)}</span> : null}
            </div>
            <div className="man2-dafare-item__badges">
              <span className="man2-badge man2-dafare-badge--origin">Segnalazione</span>
              {item.tipo && item.tipo !== "-" ? (
                <span className="man2-badge">{item.tipo}</span>
              ) : null}
            </div>
          </div>
        </div>
        <div className="man2-form-actions man2-form-actions--row man2-dafare-item__actions">
          <button
            type="button"
            className="man2-btn-full"
            disabled={saving}
            onClick={() => void handleOpenCreaManutenzioneSegnalazione(item)}
          >
            Crea manutenzione (Da fare)
          </button>
          <div className="man2-row-menu man2-row-menu--side">
            <button
              type="button"
              className="man2-row-menu__trigger"
              aria-label={`Altre azioni segnalazione ${title}`}
              aria-expanded={segnalazioneMenuId === menuId}
              onClick={() =>
                setSegnalazioneMenuId((current) => (current === menuId ? null : menuId))
              }
            >
              ⋮
            </button>
            {segnalazioneMenuId === menuId ? (
              <div className="man2-row-menu__panel" role="menu">
                {menuItems.map((azione) => (
                  <button
                    key={azione.label}
                    type="button"
                    className="man2-row-menu__item"
                    role="menuitem"
                    disabled={saving}
                    style={azione.danger ? { color: "#b91c1c" } : undefined}
                    onClick={() => {
                      setSegnalazioneMenuId(null);
                      azione.onClick();
                    }}
                  >
                    {azione.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </article>
    );
  }

  function renderManutenzioneOperativaCard(args: {
    item: NextManutenzioniLegacyDatasetRecord;
    checkbox?: {
      checked: boolean;
      onToggle: () => void;
    };
    targetGroups?: ManutenzioniDaFareGroup[];
    selectedFreeIdsForTarga?: string[];
    groupKey?: string;
  }) {
    const { item, checkbox, targetGroups = [], selectedFreeIdsForTarga = [], groupKey } = args;
    const urgenza = resolveMaintenanceUrgenza(item);
    const origine = resolveMaintenanceOrigine(item);
    const stato = resolveMaintenanceStato(item);
    const menuId = `manutenzione-operativa:${item.id}`;
    const isDaFare = stato === "daFare";
    const groupActionBusy = Boolean(gruppoManutenzioneBusyKey);
    const selectedIds = selectedFreeIdsForTarga.length > 0 ? selectedFreeIdsForTarga : [item.id];

    return (
      <article
        key={item.id}
        className={`man2-last-item man2-dafare-item${checkbox?.checked ? " is-selected" : ""}`}
      >
        <div className="man2-dafare-item__main">
          {checkbox ? (
            <input
              type="checkbox"
              className="man2-dafare-item__check"
              checked={checkbox.checked}
              disabled={groupActionBusy}
              onChange={checkbox.onToggle}
              aria-label={`Seleziona manutenzione ${item.descrizione}`}
            />
          ) : (
            <span className="man2-dafare-item__check-spacer" aria-hidden="true" />
          )}
          <div className="man2-dafare-item__content">
            <div className="man2-dafare-item__title-row">
              <span className="man2-dafare-item__title">{buildDescrizioneSnippet(item.descrizione, 96)}</span>
              <span className="man2-dafare-date-chip">
                {stato === "programmata" ? "Programmata" : "Inserimento"} {formatDaFareDateLabel(item)}
              </span>
            </div>
            <div className="man2-dafare-item__meta">
              <span>{item.targa}</span>
              <span>Origine {formatMaintenanceOrigineLabel(origine)}</span>
              {item.segnalatoDa ? <span>Segnalato da {item.segnalatoDa}</span> : null}
              {groupKey ? (
                <span>In gruppo</span>
              ) : isDaFare ? (
                <span>Non in gruppo</span>
              ) : (
                <span>Non raggruppabile</span>
              )}
            </div>
            <div className="man2-dafare-item__badges">
              <span className="man2-badge man2-dafare-badge--urgency" style={URGENZA_BADGE_STYLE[urgenza]}>
                {urgenza.toUpperCase()}
              </span>
              <span
                className={`man2-badge man2-badge--${item.tipo}`}
                style={getMaintenanceStatoBadgeStyle(stato)}
                title={buildChiusuraDaEventoTitle(item)}
              >
                {formatMaintenanceStatoLabel(stato)}
              </span>
              <span className={`man2-badge man2-badge--${item.tipo}`}>{item.tipo}</span>
              <span className="man2-badge man2-dafare-badge--origin">{formatMaintenanceOrigineLabel(origine)}</span>
              {item.collegamenti && item.collegamenti.length > 0 ? (
                <span
                  className="man2-badge"
                  style={COLLEGATA_BADGE_STYLE}
                  title="Questa manutenzione è collegata ad altre voci (es. lo stesso problema ricorrente, o un documento). Aprila per vederne i collegamenti."
                >
                  Collegata ({item.collegamenti.length})
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <div className="man2-dafare-story">
          <FraseStoriaRecord
            {...recordChiusoFromRaw(item as unknown as Record<string, unknown>, undefined, {
              sourceRecords: resolveSourceRecordsForItem(item as unknown as Record<string, unknown>),
            })}
            compact
          />
        </div>
        <div className="man2-form-actions man2-form-actions--row man2-dafare-item__actions">
          <button type="button" className="man2-btn-full" onClick={() => handleCompleteDaFare(item)}>
            Eseguita
          </button>
          <div className="man2-row-menu">
            <button
              type="button"
              className="man2-row-menu__trigger"
              aria-label={`Altre azioni per manutenzione ${item.descrizione}`}
              aria-expanded={daFareMenuId === menuId}
              onClick={() => setDaFareMenuId((current) => (current === menuId ? null : menuId))}
            >
              ⋮
            </button>
            {daFareMenuId === menuId ? (
              <div className="man2-row-menu__panel" role="menu">
                {checkbox && isDaFare
                  ? targetGroups.map((gruppo) => (
                      <button
                        key={gruppo.key}
                        type="button"
                        className="man2-row-menu__item"
                        role="menuitem"
                        title="Aggiunge le manutenzioni selezionate (solo quelle «Da fare») a questo gruppo già esistente dello stesso mezzo."
                        onClick={() => {
                          setDaFareMenuId(null);
                          void handleAggiungiAGruppoManutenzioni(gruppo.gruppoId, gruppo.targa, selectedIds);
                        }}
                      >
                        Aggiungi a gruppo: {formatGruppoManutenzioneLabel(gruppo)}
                      </button>
                    ))
                  : null}
                {checkbox && isDaFare ? (
                  <button
                    type="button"
                    className="man2-row-menu__item"
                    role="menuitem"
                    title="Unisce in un'unica scheda più lavori ANCORA DA FARE dello stesso mezzo. Le manutenzioni già chiuse non si possono raggruppare: per quelle usa «Collega…». Seleziona almeno due voci con le caselle."
                    onClick={() => {
                      setDaFareMenuId(null);
                      void handleCreaGruppoManutenzioni(item.targa, selectedIds);
                    }}
                  >
                    Crea gruppo
                  </button>
                ) : null}
                {groupKey && isDaFare ? (
                  <button
                    type="button"
                    className="man2-row-menu__item"
                    role="menuitem"
                    onClick={() => {
                      setDaFareMenuId(null);
                      void handleRimuoviDaGruppoManutenzioni(groupKey, item.id);
                    }}
                  >
                    Rimuovi dal gruppo
                  </button>
                ) : null}
                <button
                  type="button"
                  className="man2-row-menu__item"
                  role="menuitem"
                  onClick={() => {
                    setDaFareMenuId(null);
                    handleEdit(item);
                  }}
                >
                  Modifica
                </button>
                <button
                  type="button"
                  className="man2-row-menu__item"
                  role="menuitem"
                  title="Lega questa manutenzione a un'altra, a una segnalazione o a un documento — anche se sono già chiusi. Usalo per i problemi che tornano (es. la stessa aria condizionata segnalata di nuovo)."
                  onClick={() => {
                    setDaFareMenuId(null);
                    void handleOpenAgganciaUniversale(item);
                  }}
                >
                  Collega…
                </button>
                <button
                  type="button"
                  className="man2-row-menu__item"
                  role="menuitem"
                  onClick={() => {
                    setDaFareMenuId(null);
                    openDetailForRecord(item);
                  }}
                >
                  Apri
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </article>
    );
  }

  return (
    <section className="man2-screen man2-screen--dafare">
      <div className="man2-dafare-head">
        <div className="man2-dafare-title-block">
          <h2 className="man2-screen-title">Da fare</h2>
          <p className="man2-dafare-subtitle">
            Filtri, segnalazioni aperte e manutenzioni operative nello stesso contenitore.
          </p>
        </div>
      </div>

      <div className="man2-dafare-controls">
        <div className="man2-field">
          <label className="man2-field__label">Urgenza</label>
          <select
            value={daFareUrgenzaFilter}
            onChange={(event) => setDaFareUrgenzaFilter(event.target.value as DaFareUrgenzaFilter)}
            aria-label="Filtra manutenzioni da fare per urgenza"
          >
            <option value="tutte">Tutte</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="bassa">Bassa</option>
          </select>
        </div>
        <div className="man2-field">
          <label className="man2-field__label">Origine</label>
          <select
            value={daFareOrigineFilter}
            onChange={(event) => setDaFareOrigineFilter(event.target.value as DaFareOrigineFilter)}
            aria-label="Filtra manutenzioni da fare per origine"
          >
            <option value="tutte">Tutte</option>
            <option value="controllo">Controllo</option>
            <option value="segnalazione">Segnalazione</option>
            <option value="manuale">Manuale</option>
          </select>
        </div>
        <button
          type="button"
          className="man2-btn man2-dafare-reset"
          onClick={() => {
            setDaFareUrgenzaFilter("tutte");
            setDaFareOrigineFilter("tutte");
          }}
        >
          Azzera filtri
        </button>
      </div>

      <section className={`man2-dafare-reports${segnalazioniDaFareExpanded ? " is-open" : ""}`}>
        <div className="man2-dafare-reports__head">
          <div>
            <div className="man2-dafare-reports__title">Segnalazioni aperte</div>
            <div className="man2-dafare-reports__meta">
              {segnalazioniEleggibili.length} non collegate
              {segnalazioniDaFareByTarga.length > 0
                ? ` - ${segnalazioniDaFareByTarga.length} targhe`
                : ""}
              {" - spunta per selezionare e raggruppare"}
            </div>
          </div>
          <button
            type="button"
            className={`man2-btn man2-dafare-toggle${segnalazioniDaFareExpanded ? " is-expanded" : ""}`}
            aria-expanded={segnalazioniDaFareExpanded}
            onClick={() => setSegnalazioniDaFareExpanded((current) => !current)}
          >
            {segnalazioniDaFareExpanded ? "Comprimi ▾" : "Espandi ▸"}
          </button>
        </div>
      {segnalazioniDaFareExpanded ? (
        <div className="man2-dafare-reports__body">
          {lavoroGruppoRetryState ? (
            <div className="man2-grp-alert">
              <span>
                Lavoro creato, {lavoroGruppoRetryState.failedIds.length} segnalazioni non agganciate.
              </span>
              <button
                type="button"
                className="man2-grp-btn"
                disabled={saving}
                onClick={() => void handleRetryAggancioLavoroGruppo()}
              >
                Riprova
              </button>
            </div>
          ) : null}
          <div className="man2-grp-list">
            {segnalazioniDaFareByTarga.length > 0 ? (
              segnalazioniDaFareByTarga.map((targaGroup) => {
                const selectedFreeIdsForTarga = targaGroup.libere
                  .filter((item) => selectedSegnalazioneIds.includes(item.id))
                  .map((item) => item.id);
                const targetGroupForLibere = targaGroup.gruppi[0] ?? null;
                return (
                  <section key={targaGroup.targa} className="man2-grp-targa">
                    <div className="man2-grp-targa__head">
                      <span>{targaGroup.targa}</span>
                      <span>
                        {targaGroup.gruppi.reduce(
                          (sum, gruppo) => sum + gruppo.segnalazioni.length,
                          0,
                        ) + targaGroup.libere.length}{" "}
                        segnalazioni
                      </span>
                    </div>
                    {targaGroup.gruppi.map((gruppo) => {
                      const selectedIds = selectedGruppoSegnalazioneIds[gruppo.key] ?? [];
                      return (
                        <article key={gruppo.key} className="man2-grp-card">
                          <div className="man2-grp-card__head">
                            <div>
                              <div className="man2-grp-card__title">Gruppo segnalazioni</div>
                              <div className="man2-grp-card__meta">
                                {gruppo.segnalazioni.length} aperte su {gruppo.targa}
                                {selectedIds.length > 0 ? ` - ${selectedIds.length} selezionate` : ""}
                              </div>
                            </div>
                            <div className="man2-grp-card__actions">
                              <button
                                type="button"
                                className="man2-grp-btn man2-grp-btn--ghost"
                                disabled={saving}
                                onClick={() => void handleCreaLavoroDaGruppo(gruppo)}
                              >
                                Crea lavoro (Da fare)
                              </button>
                            </div>
                          </div>
                          <div className="man2-last-list man2-dafare-maintenance-list">
                            {gruppo.segnalazioni.map((item) =>
                              renderSegnalazioneCard(item, {
                                checkbox: {
                                  checked: selectedIds.includes(item.id),
                                  onToggle: () =>
                                    toggleGruppoSegnalazioneSelection(gruppo.key, item.id),
                                },
                                menuItems: [
                                  {
                                    label: "Rimuovi dal gruppo",
                                    onClick: () => void handleRimuoviDaGruppo(gruppo.key, item.id),
                                  },
                                  {
                                    label: "Collega a manutenzione…",
                                    onClick: () => void handleOpenAgganciaSegnalazione(item),
                                  },
                                  {
                                    label: "Elimina segnalazione",
                                    danger: true,
                                    onClick: () => void handleDeleteSegnalazione(item),
                                  },
                                ],
                              }),
                            )}
                          </div>
                        </article>
                      );
                    })}
                    {targaGroup.libere.length > 0 ? (
                      <article className="man2-grp-card man2-grp-card--free">
                        <div className="man2-grp-card__head">
                          <div>
                            <div className="man2-grp-card__title">Non raggruppate</div>
                            <div className="man2-grp-card__meta">
                              {targaGroup.libere.length} segnalazioni disponibili
                              {selectedFreeIdsForTarga.length > 0
                                ? ` - ${selectedFreeIdsForTarga.length} selezionate`
                                : ""}
                            </div>
                          </div>
                          <div className="man2-grp-card__actions">
                            <button
                              type="button"
                              className="man2-grp-btn man2-grp-btn--ghost"
                              disabled={saving || selectedFreeIdsForTarga.length === 0}
                              onClick={() =>
                                void handleCreaGruppoSegnalazioni(
                                  targaGroup.targa,
                                  selectedFreeIdsForTarga,
                                )
                              }
                            >
                              Crea gruppo dai selezionati
                            </button>
                            {targetGroupForLibere ? (
                              <button
                                type="button"
                                className="man2-grp-btn man2-grp-btn--ghost"
                                disabled={saving || selectedFreeIdsForTarga.length === 0}
                                onClick={() =>
                                  void handleAggiungiAGruppo(
                                    targetGroupForLibere.gruppoId,
                                    targetGroupForLibere.targa,
                                    selectedFreeIdsForTarga,
                                  )
                                }
                              >
                                Aggiungi al gruppo
                              </button>
                            ) : null}
                          </div>
                        </div>
                        <div className="man2-last-list man2-dafare-maintenance-list">
                          {targaGroup.libere.map((item) =>
                            renderSegnalazioneCard(item, {
                              checkbox: {
                                checked: selectedSegnalazioneIds.includes(item.id),
                                onToggle: () => toggleSegnalazioneLiberaSelection(item.id),
                              },
                              menuItems: [
                                {
                                  label: "Collega a manutenzione…",
                                  onClick: () => void handleOpenAgganciaSegnalazione(item),
                                },
                                {
                                  label: "Elimina segnalazione",
                                  danger: true,
                                  onClick: () => void handleDeleteSegnalazione(item),
                                },
                              ],
                            }),
                          )}
                        </div>
                      </article>
                    ) : null}
                  </section>
                );
              })
            ) : (
              <div className="man-empty">Nessuna segnalazione aperta non collegata con i filtri correnti.</div>
            )}
          </div>
        </div>
      ) : null}
      </section>

      <section className={`man2-dafare-reports${controlliKoDaFareExpanded ? " is-open" : ""}`}>
        <div className="man2-dafare-reports__head">
          <div>
            <div className="man2-dafare-reports__title">Controlli KO aperti</div>
            <div className="man2-dafare-reports__meta">
              {controlliKoEleggibili.length} non collegati
              {controlliKoDaFareByTarga.length > 0 ? ` - ${controlliKoDaFareByTarga.length} targhe` : ""}
            </div>
          </div>
          <button
            type="button"
            className={`man2-btn man2-dafare-toggle${controlliKoDaFareExpanded ? " is-expanded" : ""}`}
            aria-expanded={controlliKoDaFareExpanded}
            onClick={() => setControlliKoDaFareExpanded((current) => !current)}
          >
            {controlliKoDaFareExpanded ? "Comprimi ▾" : "Espandi ▸"}
          </button>
        </div>
      {controlliKoDaFareExpanded ? (
        <div className="man2-dafare-reports__body">
          <div className="man2-grp-list">
            {controlliKoDaFareByTarga.length > 0 ? (
              controlliKoDaFareByTarga.map((targaGroup) => (
                <section key={targaGroup.targa} className="man2-grp-targa">
                  <div className="man2-grp-targa__head">
                    <span>{targaGroup.targa}</span>
                    <span>{targaGroup.controlli.length} controlli KO</span>
                  </div>
                  <div className="man2-last-list man2-dafare-maintenance-list">
                    {targaGroup.controlli.map((item) => renderControlloKoCard(item))}
                  </div>
                </section>
              ))
            ) : (
              <div className="man-empty">
                Nessun controllo KO aperto non collegato con i filtri correnti.
              </div>
            )}
          </div>
        </div>
      ) : null}
      </section>

      <div className="man2-section-title man2-dafare-section-title">
        Manutenzioni operative ({manutenzioniOperativeFiltrate.length})
      </div>
      <div className="man2-last-list man2-dafare-maintenance-list">
        {manutenzioniOperativeFiltrate.length > 0 ? (
          <>
            {manutenzioniOperativeGrouped.gruppi.map((gruppo) => (
              <article key={gruppo.key} className="man2-grp-card">
                <div className="man2-grp-card__head">
                  <div>
                    <div className="man2-grp-card__title">Gruppo manutenzioni</div>
                    <div className="man2-grp-card__meta">
                      {gruppo.manutenzioni.length} da fare su {gruppo.targa}
                    </div>
                  </div>
                </div>
                <div className="man2-last-list">
                  {gruppo.manutenzioni.map((item) =>
                    renderManutenzioneOperativaCard({
                      item,
                      groupKey: gruppo.key,
                    }),
                  )}
                </div>
              </article>
            ))}
            {manutenzioniOperativeGrouped.libere.map((item) => {
              const selectedFreeIdsForTarga = manutenzioniOperativeGrouped.libere
                .filter((entry) => entry.targa === item.targa && selectedManutenzioneLiberaIds.includes(entry.id))
                .map((entry) => entry.id);
              const targetGroups = manutenzioniOperativeGrouped.gruppi.filter((gruppo) => gruppo.targa === item.targa);
              return renderManutenzioneOperativaCard({
                item,
                checkbox: {
                  checked: selectedManutenzioneLiberaIds.includes(item.id),
                  onToggle: () => toggleManutenzioneLiberaSelection(item.id),
                },
                selectedFreeIdsForTarga,
                targetGroups,
              });
            })}
            {manutenzioniOperativeGrouped.altre.map((item) =>
              renderManutenzioneOperativaCard({ item }),
            )}
          </>
        ) : (
          <div className="man-empty">Nessuna manutenzione da fare o programmata con i filtri correnti.</div>
        )}
      </div>
    </section>
  );
}
