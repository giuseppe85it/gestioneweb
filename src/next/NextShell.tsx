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

const activeAreaFromPath = (pathname: string): NextAreaId | null => {
  const item = NEXT_NAV_ITEMS.find((entry) => pathname.startsWith(entry.path));
  return (item?.id as NextAreaId | undefined) ?? null;
};

const SHELL_PAGE_DESCRIPTIONS: Record<NextAreaId, string> = {
  "centro-controllo": "Priorita del giorno, alert e accessi rapidi alle aree operative.",
  "mezzi-dossier": "Ricerca mezzi, apertura del Dossier e lettura dell'area flotta.",
  "operativita-globale": "Ordini, avanzamento e workbench delle attivita condivise.",
  "ia-gestionale": "Richieste guidate, sintesi contestuali e collegamenti ai record utili.",
  "strumenti-trasversali": "Servizi comuni e supporto di piattaforma, senza rumore operativo.",
};

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
  const searchPlaceholder = activeArea?.searchPlaceholder ?? "Cerca targa, ordine o fornitore";
  const quickLinks = visibleNavItems.filter((item) => item.id !== activeAreaId).slice(0, 2);

  return (
    <div className="next-app">
      <aside className="next-sidebar">
        <div className="next-brand">
          <span className="next-brand__eyebrow">GestioneManutenzione</span>
          <strong>Area gestionale</strong>
          <p>Accessi principali della nuova interfaccia operativa.</p>
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
          <p className="next-role-switch__hint">Cambio rapido del profilo visibile.</p>
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
            <label className="next-search">
              <span className="next-search__label">Ricerca globale</span>
              <input
                type="text"
                value=""
                readOnly
                placeholder={searchPlaceholder}
                aria-label="Ricerca globale NEXT placeholder"
              />
            </label>
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
