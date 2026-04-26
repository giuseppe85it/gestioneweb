import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import "./next-clone-page-scaffold.css";

type NextClonePageScaffoldProps = {
  eyebrow: string;
  title: string;
  description: string;
  backTo?: string;
  backLabel?: string;
  children: ReactNode;
  notice?: ReactNode;
  actions?: ReactNode;
};

export default function NextClonePageScaffold({
  eyebrow,
  title,
  description,
  backTo,
  backLabel = "Torna indietro",
  children,
  notice,
  actions,
}: NextClonePageScaffoldProps) {
  return (
    <div className="next-structural-page">
      <div className="next-structural-page__shell">
        <header className="next-structural-page__header">
          <div className="next-structural-page__header-main">
            {backTo ? (
              <Link className="next-structural-page__back" to={backTo}>
                {backLabel}
              </Link>
            ) : null}
            <div className="next-structural-page__eyebrow">{eyebrow}</div>
            <h1 className="next-structural-page__title">{title}</h1>
            <p className="next-structural-page__description">{description}</p>
          </div>
          <div className="next-structural-page__actions">
            <span className="next-clone-readonly-badge">CLONE READ-ONLY</span>
            {actions}
          </div>
        </header>

        {notice ? <section className="next-structural-page__notice">{notice}</section> : null}

        <section className="next-structural-page__body">{children}</section>
      </div>
    </div>
  );
}

