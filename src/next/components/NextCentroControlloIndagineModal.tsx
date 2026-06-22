import { useEffect, useMemo, useState } from "react";
import type {
  Anomaly,
  AnomalyType,
  RefuelConsumptionIndex,
  RefuelRow,
  RefuelSeedIndex,
} from "../types/centroControlloTypes";
import {
  describeAnomaly,
  detectRefuelReportAnomalies,
  formatDateItDisplay,
  formatDecimalIt,
  formatIntegerIt,
  formatMediaLitriKm,
} from "../helpers/refuelAnomalies";
import NextAnomaliaGuidaModal from "./NextAnomaliaGuidaModal";

type Props = {
  open: boolean;
  row: RefuelRow | null;
  onClose: () => void;
  refuelRows: RefuelRow[];
  refuelSeedIndex: RefuelSeedIndex;
  refuelConsumptionIndex: RefuelConsumptionIndex;
};

export default function NextCentroControlloIndagineModal({
  open,
  row,
  onClose,
  refuelRows,
  refuelSeedIndex,
  refuelConsumptionIndex,
}: Props) {
  const [investigationExpansion, setInvestigationExpansion] = useState<5 | 10 | "all">(5);
  const [guidaOpen, setGuidaOpen] = useState(false);
  const [guidaFocus, setGuidaFocus] = useState<AnomalyType | null>(null);
  const openGuida = (type: AnomalyType | null = null) => {
    setGuidaFocus(type);
    setGuidaOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetta lo stato locale quando si apre un'indagine diversa.
    setInvestigationExpansion(5);
  }, [open, row]);

  const investigationData = useMemo(() => {
    if (!open || !row) return null;
    const target = row;
    const targaNorm = target.targa;
    const autistaKey = (target.autistaNome ?? "").trim().toLowerCase();

    const mezzoHistoryAll = refuelRows
      .filter((r) => r.targa === targaNorm)
      .sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());

    const computeEntry = (innerRow: RefuelRow) => {
      const seed = refuelSeedIndex.findSeed(innerRow);
      let mediaLitriKm = "—";
      let mediaLitriKmValue: number | null = null;
      if (
        seed &&
        typeof innerRow.km === "number" && innerRow.km > 0 &&
        typeof seed.km === "number" && seed.km > 0 &&
        innerRow.km > seed.km &&
        typeof innerRow.litri === "number" && innerRow.litri > 0
      ) {
        const mediaKmL = (innerRow.km - seed.km) / innerRow.litri;
        if (Number.isFinite(mediaKmL) && mediaKmL > 0) {
          mediaLitriKm = formatMediaLitriKm(mediaKmL);
          mediaLitriKmValue = mediaKmL;
        }
      }
      const anomalies = detectRefuelReportAnomalies(
        innerRow,
        seed,
        refuelConsumptionIndex,
      );
      const windowConsumption = refuelConsumptionIndex.getWindowConsumption(
        innerRow,
        seed,
      );
      return {
        row: innerRow,
        seed,
        mediaLitriKm,
        mediaLitriKmValue,
        anomalies,
        windowConsumption,
      };
    };

    const mezzoHistoryEntries = mezzoHistoryAll.map(computeEntry);
    const totalMezzo = mezzoHistoryEntries.length;

    let visibleCount: number;
    if (investigationExpansion === "all") {
      visibleCount = totalMezzo;
    } else {
      visibleCount = Math.min(investigationExpansion, totalMezzo);
    }
    const mezzoHistoryVisible = mezzoHistoryEntries.slice(0, visibleCount);

    const ultimi5MezzoEntries = mezzoHistoryEntries.slice(0, 5);
    const ultimi5MezzoCount = ultimi5MezzoEntries.length;
    const mezzoAnomalieCount = ultimi5MezzoEntries.filter(
      (e) => e.anomalies.length > 0,
    ).length;

    let autistaAnomalieCount = 0;
    let ultimi5AutistaCount = 0;
    if (autistaKey) {
      const autistaHistoryAll = refuelRows
        .filter((r) => (r.autistaNome ?? "").trim().toLowerCase() === autistaKey)
        .sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
      const ultimi5Autista = autistaHistoryAll.slice(0, 5).map(computeEntry);
      ultimi5AutistaCount = ultimi5Autista.length;
      autistaAnomalieCount = ultimi5Autista.filter(
        (e) => e.anomalies.length > 0,
      ).length;
    }

    const targetEntry = computeEntry(target);

    const targetAnomalies = targetEntry.anomalies;
    const targetSeed = targetEntry.seed;
    const targetMediaLabel = targetEntry.mediaLitriKm;

    const descriptions = targetAnomalies.map((anomaly) => ({
      anomaly,
      text: describeAnomaly(anomaly, target, targetSeed),
    }));

    return {
      target,
      targetSeed,
      targetAnomalies,
      targetMediaLabel,
      descriptions,
      mezzoHistoryVisible,
      totalMezzo,
      visibleCount,
      mezzoAnomalieCount,
      ultimi5MezzoCount,
      autistaAnomalieCount,
      ultimi5AutistaCount,
      autistaKey,
    };
  }, [
    open,
    row,
    investigationExpansion,
    refuelRows,
    refuelSeedIndex,
    refuelConsumptionIndex,
  ]);

  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open || !investigationData) return null;

  const data = investigationData;
  const target = data.target;
  const targetAnomalies = data.targetAnomalies;
  const descriptions = data.descriptions;
  const totalMezzo = data.totalMezzo;
  const visibleCount = data.visibleCount;
  const mezzoHistoryVisible = data.mezzoHistoryVisible;
  const mezzoCount = data.mezzoAnomalieCount;
  const nMezzo = data.ultimi5MezzoCount;
  const autistaCount = data.autistaAnomalieCount;
  const nAutista = data.ultimi5AutistaCount;
  const hasAutista = data.autistaKey.length > 0;

  const targetKmAnomalies = targetAnomalies.filter((a) => a.target === "km");
  const targetLitriAnomalies = targetAnomalies.filter(
    (a) => a.target === "litri",
  );
  const targetConsumoAnomalies = targetAnomalies.filter(
    (a) => a.target === "consumo",
  );
  const targetDataAnomalies = targetAnomalies.filter(
    (a) => a.target === "km" || a.target === "litri",
  );
  const hasOnlyConsumptionAnomaly =
    targetConsumoAnomalies.length > 0 && targetDataAnomalies.length === 0;

  let p1Title: string;
  let p1Sub: string;
  let p1Variant: "isolata" | "parziale" | "sistematica" = "parziale";
  if (hasOnlyConsumptionAnomaly && mezzoCount <= 1) {
    p1Title = `Consumo sospetto ISOLATO - solo 1 segnale su ${nMezzo} rifornimenti recenti del mezzo.`;
    p1Sub =
      "Non e un errore matematico: il consumo e possibile, ma fuori media storica autista+targa.";
    p1Variant = "isolata";
  } else if (hasOnlyConsumptionAnomaly && mezzoCount === 2) {
    p1Title = `Consumo sospetto parzialmente ricorrente - 2 segnali su ${nMezzo} rifornimenti recenti del mezzo.`;
    p1Sub =
      "Verifica se lo stesso schema si ripete su percorso, carico, mezzo o autista.";
    p1Variant = "parziale";
  } else if (hasOnlyConsumptionAnomaly) {
    p1Title = `Consumo sospetto SISTEMATICO - ${mezzoCount} segnali su ${nMezzo} rifornimenti recenti del mezzo.`;
    p1Sub =
      "Pattern ricorrente: serve indagine operativa, non una correzione automatica.";
    p1Variant = "sistematica";
  } else if (mezzoCount <= 1) {
    p1Title = `Anomalia ISOLATA — solo 1 anomalia su ${nMezzo} rifornimenti recenti del mezzo.`;
    p1Sub =
      "I rifornimenti precedenti e successivi sono coerenti tra loro. L'errore è circoscritto a questo singolo record.";
    p1Variant = "isolata";
  } else if (mezzoCount === 2) {
    p1Title = `Anomalia parzialmente ricorrente — 2 anomalie su ${nMezzo} rifornimenti recenti del mezzo.`;
    p1Sub =
      "Alcuni rifornimenti presentano segnalazioni. Verifica se c'è un pattern.";
    p1Variant = "parziale";
  // eslint-disable-next-line no-dupe-else-if -- ramo irraggiungibile dopo la nuova casistica consumo, mantenuto per non toccare altra logica del modale.
  } else if (hasOnlyConsumptionAnomaly) {
    const autistaLabel = target.autistaNome ?? "â€”";
    const consumption = targetConsumoAnomalies[0]?.consumption ?? null;
    p1Title = `Consumo sospetto su ${target.targa}: confronto storico autista+targa per ${autistaLabel}.`;
    p1Sub = consumption
      ? `Consumo recente ${formatMediaLitriKm(
          consumption.currentKmL,
        )}; media storica ${formatMediaLitriKm(consumption.historicalKmL)}.`
      : "Confronto storico disponibile sul dettaglio anomalia.";
  } else {
    p1Title = `Anomalia SISTEMATICA — ${mezzoCount} anomalie su ${nMezzo} rifornimenti recenti del mezzo.`;
    p1Sub =
      "Pattern ricorrente: serve indagine operativa (mezzo o procedura).";
    p1Variant = "sistematica";
  }

  const p2Title = `Mezzo ${target.targa}: ${mezzoCount}/${nMezzo} anomalie recenti.`;
  let p2Sub: string;
  if (mezzoCount === 0) {
    p2Sub = "Il mezzo non mostra problemi sui suoi rifornimenti.";
  } else if (mezzoCount === 1) {
    p2Sub =
      "Il mezzo non mostra problemi sistematici sui suoi rifornimenti.";
  } else if (mezzoCount === 2) {
    p2Sub = "Verifica se ci sono problemi ricorrenti sul mezzo.";
  } else {
    p2Sub =
      "Mezzo con anomalie ricorrenti — verifica manutenzione, contachilometri, abitudini di rifornimento.";
  }

  let p3Title: string;
  let p3Sub: string;
  if (!hasAutista) {
    p3Title =
      "Autista non identificato sul record corrente — analisi non applicabile.";
    p3Sub = "";
  } else if (hasOnlyConsumptionAnomaly) {
    const autistaLabel = target.autistaNome ?? "â€”";
    const consumption = targetConsumoAnomalies[0]?.consumption ?? null;
    p3Title = `Autista ${autistaLabel} su ${target.targa}: confronto tra consumo recente (finestra) e media storica della stessa coppia autista+targa.`;
    p3Sub = consumption
      ? `Consumo recente ${formatMediaLitriKm(
          consumption.currentKmL,
        )}; media storica ${formatMediaLitriKm(consumption.historicalKmL)}.`
      : "Confronto storico disponibile sul dettaglio anomalia.";
  } else {
    const autistaLabel = target.autistaNome ?? "—";
    p3Title = `Autista ${autistaLabel}: ${autistaCount}/${nAutista} anomalie sui suoi ultimi ${nAutista} rifornimenti (su qualsiasi mezzo).`;
    if (autistaCount === 0) {
      p3Sub = "L'autista non mostra problemi sui suoi rifornimenti.";
    } else if (autistaCount === 1) {
      p3Sub =
        "L'autista non mostra problemi sistematici sui suoi rifornimenti.";
    } else if (autistaCount === 2) {
      p3Sub = "Verifica se ci sono problemi ricorrenti sull'autista.";
    } else {
      p3Sub =
        "Autista con anomalie ricorrenti — verifica formazione o procedure di registrazione.";
    }
  }

  let p4Title: string;
  if (hasOnlyConsumptionAnomaly) {
    p4Title =
      "Il consumo recente è molto sotto la media storica del mezzo. Prima di correggere o contestare, confronta percorso, carico, stile di guida e stato del mezzo: è una tendenza su più pieni, non un singolo rifornimento.";
  } else if (mezzoCount >= 2 && autistaCount >= 2) {
    p4Title =
      "Anomalie concentrate su MEZZO E AUTISTA insieme. Probabile accoppiamento problematico (autista che usa spesso questo mezzo e fa errori specifici).";
  } else if (mezzoCount >= 2 && autistaCount < 2) {
    p4Title =
      "Anomalie concentrate sul MEZZO (l'autista non mostra problemi su altri mezzi). Probabile problema del mezzo (es. contachilometri difettoso).";
  } else if (mezzoCount < 2 && autistaCount >= 2) {
    p4Title =
      "Anomalie concentrate sull'AUTISTA (il mezzo non mostra problemi con altri autisti). Probabile errore ricorrente di battitura o procedura dell'autista.";
  } else {
    p4Title = `Caso singolo: nessun pattern emergente né sul mezzo né sull'autista. Probabile errore manuale isolato. Verificare il valore reale al ${formatDateItDisplay(target.dateObj)} per correggere il record.`;
  }

  const renderHistoryWarning = (list: Anomaly[]) => {
    if (list.length === 0) return null;
    const hasOnlyConsumption = list.every((a) => a.target === "consumo");
    const tooltip = list.map((a) => a.message).join(" · ");
    return (
      <span
        className={`cc-cell-warning${
          hasOnlyConsumption ? " cc-cell-warning-consumo" : ""
        }`}
        title={tooltip}
        aria-label="Anomalia rilevata"
      >
        ⚠
      </span>
    );
  };

  return (
    <>
    <div
      className="cc-investigation-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Indagine anomalia"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="cc-investigation-dialog">
        <div className="cc-investigation-header">
          <div>
            <h3>Indagine anomalia</h3>
            <p className="cc-investigation-subtitle">
              Rifornimento del {formatDateItDisplay(target.dateObj)} ·{" "}
              {target.targa}
            </p>
          </div>
          <button
            type="button"
            className="cc-investigation-close"
            onClick={onClose}
            aria-label="Chiudi indagine"
          >
            ×
          </button>
        </div>

        <div className="cc-investigation-body">
          <div style={{ marginBottom: "0.5rem" }}>
            <button
              type="button"
              className="cc-secondary-btn"
              onClick={() => openGuida(null)}
            >
              ❔ Cosa significano questi avvisi?
            </button>
          </div>
          <section className="cc-investigation-card">
            <h4>Rifornimento sospetto</h4>
            <div className="cc-investigation-record-grid">
              <div>
                <span className="cc-investigation-label">Data</span>
                <strong>{formatDateItDisplay(target.dateObj)}</strong>
              </div>
              <div>
                <span className="cc-investigation-label">Targa</span>
                <strong>{target.targa}</strong>
              </div>
              <div>
                <span className="cc-investigation-label">Autista</span>
                <strong>{target.autistaNome ?? "—"}</strong>
              </div>
              <div>
                <span className="cc-investigation-label">Km</span>
                <strong>
                  {typeof target.km === "number"
                    ? formatIntegerIt(target.km)
                    : "—"}
                  {targetKmAnomalies.length > 0 && (
                    <span className="cc-cell-warning" aria-hidden="true">
                      {" "}
                      ⚠
                    </span>
                  )}
                </strong>
              </div>
              <div>
                <span className="cc-investigation-label">Litri</span>
                <strong>
                  {typeof target.litri === "number"
                    ? formatDecimalIt(target.litri, 2)
                    : "—"}
                  {targetLitriAnomalies.length > 0 && (
                    <span className="cc-cell-warning" aria-hidden="true">
                      {" "}
                      ⚠
                    </span>
                  )}
                </strong>
              </div>
              <div>
                <span className="cc-investigation-label">Media km/L</span>
                <strong>{data.targetMediaLabel}</strong>
              </div>
              <div>
                <span className="cc-investigation-label">Fonte</span>
                <strong>{target.sourceLabel}</strong>
              </div>
            </div>
            {targetConsumoAnomalies.length > 0 && (
              <div className="cc-investigation-consumption-box">
                <span className="cc-anomaly-pill cc-anomaly-pill-consumo">
                  Consumo sospetto
                </span>
                <p>
                  Il dato e possibile ma fuori media: verificare prima di
                  correggere o contestare.
                </p>
              </div>
            )}
            {descriptions.length > 0 && (
              <div className="cc-investigation-anomaly-list">
                {descriptions.map(({ anomaly, text }, idx) => (
                  <div
                    key={idx}
                    className={`cc-investigation-anomaly-desc${
                      anomaly.target === "consumo"
                        ? " cc-investigation-anomaly-desc-consumo"
                        : ""
                    }`}
                  >
                    <span className="cc-investigation-anomaly-icon">
                      ⚠
                    </span>
                    <span>{text}</span>
                    <button
                      type="button"
                      className="cc-investigation-expand-btn"
                      onClick={() => openGuida(anomaly.type)}
                    >
                      Come funziona?
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="cc-investigation-card">
            <h4>Storia ultimi rifornimenti · {target.targa}</h4>
            <div className="cc-investigation-counter">
              Mostrati {visibleCount} di {totalMezzo}
            </div>
            <div className="cc-table-wrap">
              <table className="cc-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Autista</th>
                    <th>Km</th>
                    <th>Litri</th>
                    <th>Km/L</th>
                    <th>Media 4 rif.</th>
                    <th>Fonte</th>
                    <th>Anomalie</th>
                  </tr>
                </thead>
                <tbody>
                  {mezzoHistoryVisible.map((entry) => {
                    const isCurrent =
                      entry.row.id === target.id &&
                      entry.row.dateObj.getTime() ===
                        target.dateObj.getTime();
                    return (
                      <tr
                        key={`${entry.row.id}_${entry.row.dateObj.getTime()}`}
                        className={
                          isCurrent
                            ? "cc-investigation-row-current"
                            : undefined
                        }
                      >
                        <td>{formatDateItDisplay(entry.row.dateObj)}</td>
                        <td>{entry.row.autistaNome ?? "—"}</td>
                        <td>
                          {typeof entry.row.km === "number"
                            ? formatIntegerIt(entry.row.km)
                            : "—"}
                        </td>
                        <td>
                          {typeof entry.row.litri === "number"
                            ? formatDecimalIt(entry.row.litri, 2)
                            : "—"}
                        </td>
                        <td>{entry.mediaLitriKm}</td>
                        <td
                          className={
                            entry.windowConsumption?.isBelowThreshold
                              ? "cc-cell-warning-consumo"
                              : undefined
                          }
                          title={
                            entry.windowConsumption
                              ? `Media degli ultimi ${entry.windowConsumption.windowCount} rifornimenti, contro media storica ${formatMediaLitriKm(
                                  entry.windowConsumption.baselineKmL,
                                )}`
                              : "Servono almeno 4 rifornimenti recenti e una storia sufficiente"
                          }
                        >
                          {entry.windowConsumption
                            ? formatMediaLitriKm(entry.windowConsumption.windowKmL)
                            : "—"}
                        </td>
                        <td>{entry.row.sourceLabel}</td>
                        <td>{renderHistoryWarning(entry.anomalies)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="cc-investigation-expand-row">
              {investigationExpansion === 5 && totalMezzo > 5 && (
                <button
                  type="button"
                  className="cc-investigation-expand-btn"
                  onClick={() => setInvestigationExpansion(10)}
                >
                  Mostra altri 5
                </button>
              )}
              {investigationExpansion !== "all" &&
                totalMezzo > visibleCount && (
                  <button
                    type="button"
                    className="cc-investigation-expand-btn"
                    onClick={() => setInvestigationExpansion("all")}
                  >
                    Mostra tutti ({totalMezzo})
                  </button>
                )}
            </div>
          </section>

          <section className="cc-investigation-card">
            <h4>Cosa dicono i dati</h4>
            <div className="cc-investigation-patterns">
              <div
                className={`cc-investigation-pattern-card${
                  p1Variant === "sistematica"
                    ? " cc-investigation-pattern-card-warn"
                    : p1Variant === "isolata"
                      ? " cc-investigation-pattern-card-warn"
                      : ""
                }`}
              >
                <span className="cc-investigation-pattern-icon">⚠</span>
                <div>
                  <strong>{p1Title}</strong>
                  <p>{p1Sub}</p>
                </div>
              </div>
              <div className="cc-investigation-pattern-card">
                <span className="cc-investigation-pattern-icon">📊</span>
                <div>
                  <strong>{p2Title}</strong>
                  <p>{p2Sub}</p>
                </div>
              </div>
              <div className="cc-investigation-pattern-card">
                <span className="cc-investigation-pattern-icon">👤</span>
                <div>
                  <strong>{p3Title}</strong>
                  {p3Sub && <p>{p3Sub}</p>}
                </div>
              </div>
              <div className="cc-investigation-pattern-card">
                <span className="cc-investigation-pattern-icon">🔍</span>
                <div>
                  <strong>{p4Title}</strong>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="cc-investigation-footer">
          <button
            type="button"
            className="cc-secondary-btn"
            onClick={onClose}
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
      <NextAnomaliaGuidaModal
        open={guidaOpen}
        focusType={guidaFocus}
        onClose={() => setGuidaOpen(false)}
      />
    </>
  );
}
