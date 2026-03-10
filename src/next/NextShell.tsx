import { NavLink, Outlet } from "react-router-dom";
import "./next-shell.css";

function NextShell() {
  return (
    <div className="next-clone-shell">
      <header className="next-clone-topbar">
        <div className="next-clone-brand">
          <img src="/logo.png" alt="Logo" className="next-clone-brand__logo" />
          <div>
            <div className="next-clone-brand__title">GestioneManutenzione NEXT</div>
            <div className="next-clone-brand__subtitle">Clone read-only del gestionale madre</div>
          </div>
        </div>

        <nav className="next-clone-nav" aria-label="Navigazione clone NEXT">
          <NavLink to="/next/centro-controllo" className={({ isActive }) => isActive ? "next-clone-nav__link next-clone-nav__link--active" : "next-clone-nav__link"}>
            Home
          </NavLink>
          <NavLink to="/next/operativita-globale" className={({ isActive }) => isActive ? "next-clone-nav__link next-clone-nav__link--active" : "next-clone-nav__link"}>
            Gestione Operativa
          </NavLink>
          <NavLink to="/next/mezzi-dossier" className={({ isActive }) => isActive ? "next-clone-nav__link next-clone-nav__link--active" : "next-clone-nav__link"}>
            Mezzi
          </NavLink>
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
