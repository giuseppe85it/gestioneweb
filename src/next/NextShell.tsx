import { Link, NavLink, Outlet } from "react-router-dom";
import { NEXT_NAV_ITEMS } from "./nextData";
import "./next-shell.css";

function NextShell() {
  return (
    <div className="next-clone-shell">
      <header className="next-clone-topbar">
        <Link to="/next" className="next-clone-brand">
          <img src="/logo.png" alt="Logo" className="next-clone-brand__logo" />
          <div>
            <div className="next-clone-brand__title">GestioneManutenzione NEXT</div>
            <div className="next-clone-brand__subtitle">Clone read-only del gestionale madre</div>
          </div>
        </Link>

        <nav className="next-clone-nav" aria-label="Navigazione clone NEXT">
          {NEXT_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.path === "/next"}
              className={({ isActive }) =>
                isActive
                  ? "next-clone-nav__link next-clone-nav__link--active"
                  : "next-clone-nav__link"
              }
              title={item.scope}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="next-clone-topbar__actions">
          <span className="next-clone-readonly-badge">CLONE READ-ONLY</span>
          <span
            className="next-clone-topbar__link next-clone-topbar__link--disabled"
            aria-disabled="true"
            title="Accesso alla madre bloccato dal clone read-only"
          >
            Apri madre
          </span>
        </div>
      </header>

      <main className="next-clone-main">
        <Outlet />
      </main>
    </div>
  );
}

export default NextShell;
