import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import "./next-shell.css";
import { NEXT_AREAS, NEXT_NAV_ITEMS, type NextAreaId } from "./nextData";
import {
  NEXT_DRIVER_EXPERIENCE_PATH,
  NEXT_ROLE_PRESETS,
  buildNextPathWithRole,
  getNextRoleFromSearch,
  getNextSimulatedAccessProfile,
  getVisibleNextAreaIds,
} from "./nextAccess";

const activeAreaFromPath = (pathname: string): NextAreaId | null => {
  const item = NEXT_NAV_ITEMS.find((entry) => pathname.startsWith(entry.path));
  return (item?.id as NextAreaId | undefined) ?? null;
};

function NextShell() {
  const location = useLocation();
  const role = getNextRoleFromSearch(location.search);
  const roleProfile = getNextSimulatedAccessProfile(role);
  const activeAreaId = activeAreaFromPath(location.pathname);
  const activeArea = activeAreaId ? NEXT_AREAS[activeAreaId] : null;
  const visibleAreaIds = new Set(getVisibleNextAreaIds(role));
  const visibleNavItems = NEXT_NAV_ITEMS.filter((item) => visibleAreaIds.has(item.id));
  const isDriverExperience = location.pathname.startsWith(NEXT_DRIVER_EXPERIENCE_PATH);
  const pageTitle = isDriverExperience ? "Esperienza Autista" : activeArea?.navLabel ?? "NEXT";

  return (
    <div className="next-app">
      <aside className="next-sidebar">
        <div className="next-brand">
          <span className="next-brand__eyebrow">GestioneManutenzione</span>
          <strong>NEXT</strong>
          <p>Shell separata, navigabile e pronta per la migrazione progressiva.</p>
        </div>

        <div className="next-sidebar__meta">
          <span className="next-chip next-chip--accent">Ruolo simulato: {roleProfile.shortLabel}</span>
          <p>{roleProfile.futureNote}</p>
        </div>

        <div className="next-role-switch">
          <span className="next-role-switch__label">Simulazione ruolo</span>
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
          <p className="next-role-switch__hint">
            Simulazione solo frontend. Nessuna auth reale, nessun backend, nessuna
            scrittura dati.
          </p>
        </div>

        <nav className="next-nav" aria-label="Navigazione NEXT">
          <p className="next-nav__eyebrow">Macro-aree visibili</p>
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
              <small>Separata dal gestionale principale</small>
            </NavLink>
          ) : null}

          {!visibleNavItems.length ? (
            <div className="next-empty-nav">
              <strong>Nessuna macro-area gestionale visibile</strong>
              <p>
                Questo comportamento e intenzionale: il ruolo autista non entra nella
                shell admin come versione ridotta del backoffice.
              </p>
            </div>
          ) : null}
        </nav>

        <div className="next-sidebar__footer">
          <span className="next-chip next-chip--success">Legacy invariata</span>
          <span className="next-chip next-chip--accent">Route separate /next/*</span>
          <span className="next-chip">Gating frontend per ruolo</span>
          <span className="next-chip next-chip--warning">No data writes</span>
        </div>
      </aside>

      <div className="next-main">
        <header className="next-topbar">
          <div>
            <p className="next-topbar__eyebrow">Nuova applicazione parallela</p>
            <h1>{pageTitle}</h1>
            <p className="next-topbar__description">{roleProfile.description}</p>
          </div>

          <div className="next-topbar__actions">
            <label className="next-search">
              <span className="next-search__label">Ricerca globale</span>
              <input
                type="text"
                value=""
                readOnly
                placeholder="Placeholder shell"
                aria-label="Ricerca globale NEXT placeholder"
              />
            </label>
            <div className="next-topbar__pills">
              <span className="next-chip">Read-only</span>
              <span className="next-chip">Ruolo: {roleProfile.shortLabel}</span>
              <span className="next-chip">Permessi per utente: pronti</span>
              <span className="next-chip next-chip--subtle">Nessun impatto sulla legacy</span>
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
