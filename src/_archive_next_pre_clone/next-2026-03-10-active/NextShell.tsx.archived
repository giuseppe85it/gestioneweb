import { useEffect } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import "./next-shell.css";
import { NEXT_AREAS, NEXT_NAV_ITEMS, type NextAreaId } from "./nextData";
import {
  NEXT_DRIVER_EXPERIENCE_PATH,
  NEXT_ROLE_PRESETS,
  buildNextPathWithRole,
  getNextRoleFromSearch,
  getVisibleNextAreaIds,
} from "./nextAccess";
import { trackNextPageVisit } from "./nextUsageTracking";

const activeAreaFromPath = (pathname: string): NextAreaId | null => {
  const item = NEXT_NAV_ITEMS.find((entry) => pathname.startsWith(entry.path));
  return (item?.id as NextAreaId | undefined) ?? null;
};

const SHELL_PAGE_DESCRIPTIONS: Record<NextAreaId, string> = {
  "centro-controllo": "Priorita del giorno, revisioni, segnalazioni e ingressi rapidi alle aree operative.",
  "mezzi-dossier": "Ricerca mezzi, apertura del Dossier e lettura dei blocchi gia pronti del mezzo.",
  "operativita-globale": "Ordini e coda operativa globale, separati dal lavoro sul singolo mezzo.",
  "ia-gestionale": "Domande, sintesi e passaggio rapido al record utile.",
  "strumenti-trasversali": "PDF, percorsi usati e strumenti di servizio della piattaforma.",
};

function getTrackingMeta(pathname: string, activeAreaId: NextAreaId | null) {
  if (pathname.startsWith("/next/mezzi-dossier/")) {
    const mezzoTarga = decodeURIComponent(pathname.replace("/next/mezzi-dossier/", "")).trim();
    return {
      areaId: "mezzi-dossier",
      areaLabel: "Mezzi / Dossier",
      pathKey: "/next/mezzi-dossier/:targa",
      pathLabel: "Dossier mezzo",
      pageLabel: mezzoTarga ? `Dossier ${mezzoTarga}` : "Dossier mezzo",
    };
  }

  if (pathname.startsWith(NEXT_DRIVER_EXPERIENCE_PATH)) {
    return {
      areaId: "autista",
      areaLabel: "Esperienza Autista",
      pathKey: NEXT_DRIVER_EXPERIENCE_PATH,
      pathLabel: "Esperienza Autista",
      pageLabel: "Esperienza Autista",
    };
  }

  if (activeAreaId) {
    const area = NEXT_AREAS[activeAreaId];
    return {
      areaId: activeAreaId,
      areaLabel: area.navLabel,
      pathKey: pathname,
      pathLabel: area.navLabel,
      pageLabel: area.navLabel,
    };
  }

  return {
    areaId: "next",
    areaLabel: "NEXT",
    pathKey: pathname,
    pathLabel: "NEXT",
    pageLabel: "NEXT",
  };
}

function NextShell() {
  const location = useLocation();
  const role = getNextRoleFromSearch(location.search);
  const activeAreaId = activeAreaFromPath(location.pathname);
  const activeArea = activeAreaId ? NEXT_AREAS[activeAreaId] : null;
  const visibleAreaIds = new Set(getVisibleNextAreaIds(role));
  const visibleNavItems = NEXT_NAV_ITEMS.filter((item) => visibleAreaIds.has(item.id));
  const isDriverExperience = location.pathname.startsWith(NEXT_DRIVER_EXPERIENCE_PATH);
  const pageTitle = isDriverExperience ? "Esperienza Autista" : activeArea?.navLabel ?? "NEXT";
  const pageDescription = isDriverExperience
    ? "Area separata dedicata all'operativita autista."
    : activeAreaId
      ? SHELL_PAGE_DESCRIPTIONS[activeAreaId]
      : "Aree operative, dossier e strumenti condivisi.";
  const quickLinks = visibleNavItems.filter((item) => item.id !== activeAreaId).slice(0, 2);

  useEffect(() => {
    const meta = getTrackingMeta(location.pathname, activeAreaId);
    trackNextPageVisit({
      ...meta,
      actualPath: location.pathname,
      role,
    });
  }, [activeAreaId, location.pathname, role]);

  return (
    <div className="next-app">
      <aside className="next-sidebar">
        <div className="next-brand">
          <span className="next-brand__eyebrow">GestioneManutenzione</span>
          <strong>Backoffice operativo</strong>
          <p>La stessa logica di lavoro del gestionale, con letture piu ordinate.</p>
        </div>

        <div className="next-role-switch">
          <span className="next-role-switch__label">Vista</span>
          <div className="next-role-switch__group">
            {Object.values(NEXT_ROLE_PRESETS).map((preset) => (
              <Link
                key={preset.id}
                to={buildNextPathWithRole(preset.landingPath, preset.id, location.search)}
                className={
                  preset.id === role
                    ? "next-role-switch__link next-role-switch__link--active"
                    : "next-role-switch__link"
                }
              >
                {preset.shortLabel}
              </Link>
            ))}
          </div>
          <p className="next-role-switch__hint">Profilo simulato solo per visibilita della NEXT.</p>
        </div>

        <nav className="next-nav" aria-label="Navigazione NEXT">
          <p className="next-nav__eyebrow">Aree operative</p>
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.id}
              to={buildNextPathWithRole(item.path, role, location.search)}
              className={({ isActive }) =>
                isActive ? "next-nav__link next-nav__link--active" : "next-nav__link"
              }
            >
              <span>{item.label}</span>
              <small>{item.scope}</small>
            </NavLink>
          ))}

          {role === "autista" ? (
            <NavLink
              to={buildNextPathWithRole(NEXT_DRIVER_EXPERIENCE_PATH, role, location.search)}
              className={({ isActive }) =>
                isActive ? "next-nav__link next-nav__link--active" : "next-nav__link"
              }
            >
              <span>Esperienza Autista</span>
              <small>Area dedicata</small>
            </NavLink>
          ) : null}

          {!visibleNavItems.length ? (
            <div className="next-empty-nav">
              <strong>Nessuna area disponibile</strong>
              <p>Apri l'esperienza dedicata per continuare.</p>
            </div>
          ) : null}
        </nav>
      </aside>

      <div className="next-main">
        <header className="next-topbar">
          <div>
            <p className="next-topbar__eyebrow">Area attiva</p>
            <h1>{pageTitle}</h1>
            <p className="next-topbar__description">{pageDescription}</p>
          </div>

          <div className="next-topbar__actions">
            <div className="next-topbar__context">
              <span className="next-chip next-chip--accent">
                Profilo {NEXT_ROLE_PRESETS[role].shortLabel}
              </span>
              {activeArea?.shellFocus ? (
                <span className="next-chip next-chip--subtle">{activeArea.shellFocus}</span>
              ) : null}
            </div>
            <div className="next-topbar__shortcuts">
              {quickLinks.map((item) => (
                <Link
                  key={item.id}
                  className="next-action-link"
                  to={buildNextPathWithRole(item.path, role, location.search)}
                >
                  {item.label}
                </Link>
              ))}
              {activeAreaId !== "centro-controllo" && visibleAreaIds.has("centro-controllo") ? (
                <Link
                  className="next-action-link next-action-link--primary"
                  to={buildNextPathWithRole("/next/centro-controllo", role, location.search)}
                >
                  Vai alla Home
                </Link>
              ) : null}
            </div>
          </div>
        </header>

        <main className="next-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default NextShell;
