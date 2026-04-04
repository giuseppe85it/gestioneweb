import { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import NextScadenzeModal from "./components/NextScadenzeModal";
import { NEXT_SHELL_NAV_SECTIONS, type NextShellNavItem } from "./nextData";
import { useNextCloneNavigation } from "./nextCloneNavigation";
import "./next-shell.css";

function buildInitialSectionsState() {
  return NEXT_SHELL_NAV_SECTIONS.reduce<Record<string, boolean>>((state, section) => {
    state[section.id] = true;
    return state;
  }, {});
}

function isShellNavItemActive(pathname: string, search: string, item: NextShellNavItem) {
  if (item.queryParamKey && item.queryParamValue) {
    const params = new URLSearchParams(search);
    return params.get(item.queryParamKey) === item.queryParamValue;
  }
  if (!item.path) return false;
  if (item.exact) return pathname === item.path;
  return pathname === item.path || pathname.startsWith(`${item.path}/`);
}

function NextShell() {
  const location = useLocation();
  const navigate = useNavigate();
  useNextCloneNavigation();

  const [sectionsOpen, setSectionsOpen] = useState<Record<string, boolean>>(
    buildInitialSectionsState,
  );
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const shellClassName = [
    "app-shell",
    "next-shell",
    sidebarOpen ? "next-shell--sidebar-open" : "next-shell--sidebar-closed",
  ]
    .filter(Boolean)
    .join(" ");

  const scadenzeMode = useMemo(() => {
    const value = new URLSearchParams(location.search).get("scadenze");
    return value === "tutte" || value === "urgenti" ? value : null;
  }, [location.search]);

  const openShellQueryModal = (key: string, value: string) => {
    const params = new URLSearchParams(location.search);
    params.set(key, value);
    navigate({
      pathname: location.pathname,
      search: params.toString() ? `?${params.toString()}` : "",
    });
  };

  const closeScadenzeModal = () => {
    const params = new URLSearchParams(location.search);
    params.delete("scadenze");
    navigate(
      {
        pathname: location.pathname,
        search: params.toString() ? `?${params.toString()}` : "",
      },
      { replace: true },
    );
  };

  return (
    <div className={shellClassName}>
      <div className="next-shell__sidebar-frame">
        <aside className="next-shell__sidebar" aria-label="Navigazione globale NEXT">
          <div className="next-shell__brand">
            <div className="next-shell__brand-copy-wrap">
              <img
                src="/logo.png"
                alt="Gestione e Manutenzione"
                className="next-shell__brand-logo"
              />
              <div className="next-shell__brand-copy">
                <div className="next-shell__brand-title">Gestione e Manutenzione</div>
                <div className="next-shell__brand-subtitle">Centrale operativa</div>
              </div>
            </div>

            <button
              type="button"
              className="next-shell__toggle next-shell__toggle--sidebar"
              aria-label="Chiudi menu principale"
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="next-shell__toggle-bars" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            </button>
          </div>

          <nav className="next-shell__nav" aria-label="Menu moduli NEXT">
            {NEXT_SHELL_NAV_SECTIONS.map((section) => {
              const isOpen = sectionsOpen[section.id] !== false;
              return (
                <section key={section.id} className="next-shell__nav-section">
                  <button
                    type="button"
                    className="next-shell__nav-section-toggle"
                    onClick={() =>
                      setSectionsOpen((current) => ({
                        ...current,
                        [section.id]: !isOpen,
                      }))
                    }
                    aria-expanded={isOpen}
                  >
                    <span>{section.title}</span>
                    <span className="next-shell__nav-section-sign" aria-hidden="true">
                      {isOpen ? "-" : "+"}
                    </span>
                  </button>

                  {isOpen ? (
                    <div className="next-shell__nav-items">
                      {section.items.map((item) => {
                        const itemClassName = [
                          "next-shell__nav-item",
                          isShellNavItemActive(location.pathname, location.search, item)
                            ? "next-shell__nav-item--active"
                            : "",
                          item.disabled ? "next-shell__nav-item--disabled" : "",
                        ]
                          .filter(Boolean)
                          .join(" ");

                        if (item.disabled || (!item.path && !item.queryParamKey)) {
                          return (
                            <span key={item.id} className={itemClassName} aria-disabled="true">
                              <span className="next-shell__nav-icon" aria-hidden="true" />
                              <span>{item.label}</span>
                            </span>
                          );
                        }

                        if (item.queryParamKey && item.queryParamValue) {
                          return (
                            <button
                              key={item.id}
                              type="button"
                              className={`${itemClassName} next-shell__nav-item--button`}
                              onClick={() =>
                                openShellQueryModal(item.queryParamKey as string, item.queryParamValue as string)
                              }
                            >
                              <span className="next-shell__nav-icon" aria-hidden="true" />
                              <span>{item.label}</span>
                            </button>
                          );
                        }

                        return (
                          <NavLink
                            key={item.id}
                            to={item.path as string}
                            end={item.exact}
                            className={itemClassName}
                          >
                            <span className="next-shell__nav-icon" aria-hidden="true" />
                            <span>{item.label}</span>
                          </NavLink>
                        );
                      })}
                    </div>
                  ) : null}
                </section>
              );
            })}
          </nav>

          <div className="next-shell__sidebar-footer">v2.4 &middot; GestioneManutenzione</div>
        </aside>
      </div>

      <div className="next-shell__content">
        {!sidebarOpen ? (
          <button
            type="button"
            className="next-shell__reopen-toggle"
            aria-label="Apri menu principale"
            aria-expanded="false"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="next-shell__toggle-bars" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </button>
        ) : null}

        <main className="next-shell__main">
          <Outlet />
        </main>
      </div>

      {scadenzeMode ? (
        <NextScadenzeModal mode={scadenzeMode} onClose={closeScadenzeModal} />
      ) : null}
    </div>
  );
}

export default NextShell;
