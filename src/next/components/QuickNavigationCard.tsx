import { Link } from "react-router-dom";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";

type QuickLink = {
  id: string;
  to: string;
  label: string;
  description?: string;
};

type QuickNavigationCardProps = {
  allLinks: QuickLink[];
  favorites: QuickLink[];
  anagraficheLinks: QuickLink[];
  operativoLinks: QuickLink[];
  pinnedIds: string[];
  blockedTitle: string;
  onRecordLinkUse: (id: string) => void;
  onTogglePin: (id: string) => void;
  resolveCloneSafeRoute: (path: string) => string | null;
};

type QuickSectionId =
  | "operativita"
  | "autisti"
  | "ia"
  | "anagrafiche"
  | "acquisti_magazzino"
  | "cisterna";

type QuickSection = {
  id: QuickSectionId;
  title: string;
  links: QuickLink[];
};

function compactDescription(value: string | undefined): string | null {
  const normalized = String(value || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) return null;
  return normalized.length > 64 ? `${normalized.slice(0, 61).trimEnd()}...` : normalized;
}

function QuickNavigationCard(props: QuickNavigationCardProps) {
  const {
    allLinks,
    favorites,
    anagraficheLinks,
    operativoLinks,
    pinnedIds,
    blockedTitle,
    onRecordLinkUse,
    onTogglePin,
    resolveCloneSafeRoute,
  } = props;
  const [homeQuery, setHomeQuery] = useState("");
  const [overlayQuery, setOverlayQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openSectionId, setOpenSectionId] = useState<QuickSectionId>("operativita");

  const pinnedSet = useMemo(() => new Set(pinnedIds), [pinnedIds]);
  const normalizedOverlayQuery = overlayQuery.trim().toLowerCase();

  const sections = useMemo<QuickSection[]>(() => {
    const autisti: QuickLink[] = [];
    const ia: QuickLink[] = [];
    const acquistiMagazzino: QuickLink[] = [];
    const cisterna: QuickLink[] = [];
    const operativita: QuickLink[] = [];

    operativoLinks.forEach((link) => {
      if (
        link.to === "/autisti" ||
        link.to.startsWith("/autisti/") ||
        link.to.startsWith("/autisti-inbox") ||
        link.to.startsWith("/autisti-admin") ||
        link.to.startsWith("/next/autisti-admin")
      ) {
        autisti.push(link);
        return;
      }
      if (link.to.startsWith("/cisterna")) {
        cisterna.push(link);
        return;
      }
      if (
        link.to.startsWith("/ia") ||
        link.to.startsWith("/libretti-export")
      ) {
        ia.push(link);
        return;
      }
      if (
        link.to === "/acquisti" ||
        link.to.startsWith("/materiali-") ||
        link.to.startsWith("/inventario") ||
        link.to.startsWith("/ordini-") ||
        link.to.startsWith("/attrezzature-cantieri")
      ) {
        acquistiMagazzino.push(link);
        return;
      }
      operativita.push(link);
    });

    const anagrafiche = anagraficheLinks.filter((link) => !link.to.startsWith("/autisti"));

    const nextSections: QuickSection[] = [
      { id: "operativita", title: "Operativita", links: operativita },
      { id: "autisti", title: "Autisti", links: autisti },
      { id: "ia", title: "IA", links: ia },
      { id: "anagrafiche", title: "Anagrafiche", links: anagrafiche },
      { id: "acquisti_magazzino", title: "Acquisti e Magazzino", links: acquistiMagazzino },
      { id: "cisterna", title: "Cisterna", links: cisterna },
    ];
    return nextSections.filter((section) => section.links.length > 0);
  }, [anagraficheLinks, operativoLinks]);

  const searchResults = useMemo(() => {
    if (!normalizedOverlayQuery) return [];
    return allLinks.filter((link) => link.label.toLowerCase().includes(normalizedOverlayQuery));
  }, [allLinks, normalizedOverlayQuery]);

  useEffect(() => {
    if (!drawerOpen) return;
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarGap = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarGap > 0) {
      document.body.style.paddingRight = `${scrollbarGap}px`;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [drawerOpen]);

  const openDrawer = () => {
    setOverlayQuery(homeQuery.trim());
    setDrawerOpen(true);
  };

  const favoriteItems = favorites.slice(0, 6);

  const handleHomeSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    openDrawer();
  };

  const renderLink = (link: QuickLink, mode: "favorite" | "default") => {
    const safeTo = resolveCloneSafeRoute(link.to);
    const description = compactDescription(link.description);
    const isPinned = pinnedSet.has(link.id);
    const content = (
      <>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{link.label}</span>
        {description && mode === "favorite" ? (
          <span style={{ fontSize: 12, color: "#64748b" }}>{description}</span>
        ) : null}
      </>
    );

    return (
      <div
        key={link.id}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: mode === "favorite" ? "10px 12px" : "8px 0",
          borderRadius: mode === "favorite" ? 12 : 0,
          border: mode === "favorite" ? "1px solid rgba(15, 23, 42, 0.08)" : "none",
          background: mode === "favorite" ? "#fff" : "transparent",
        }}
      >
        <div style={{ minWidth: 0, flex: 1, display: "grid", gap: 4 }}>
          {safeTo ? (
            <Link
              to={safeTo}
              onClick={() => onRecordLinkUse(link.id)}
              style={{ textDecoration: "none", display: "grid", gap: 4 }}
            >
              {content}
            </Link>
          ) : (
            <div
              aria-disabled="true"
              title={blockedTitle}
              style={{ display: "grid", gap: 4, opacity: 0.6, cursor: "not-allowed" }}
            >
              {content}
            </div>
          )}
        </div>
        {mode === "favorite" ? (
          <button
            type="button"
            onClick={() => onTogglePin(link.id)}
            aria-pressed={isPinned}
            style={{
              border: "1px solid rgba(15, 23, 42, 0.12)",
              borderRadius: 999,
              background: isPinned ? "#0f172a" : "#f8fafc",
              color: isPinned ? "#fff" : "#334155",
              fontSize: 10,
              fontWeight: 800,
              padding: "5px 9px",
              cursor: "pointer",
            }}
          >
            PIN
          </button>
        ) : null}
      </div>
    );
  };

  return (
    <>
      <section className="panel panel-quick home-card home-full" style={{ animationDelay: "240ms" }}>
        <div className="panel-head home-card__head">
          <div>
            <h2 className="home-card__title">Navigazione rapida</h2>
            <span className="home-card__subtitle">Accessi essenziali e menu completo in overlay</span>
          </div>
        </div>

        <div className="home-card__body" style={{ display: "grid", gap: 18 }}>
          <form onSubmit={handleHomeSearchSubmit} style={{ display: "grid", gap: 12 }}>
            <input
              className="quick-search-input"
              value={homeQuery}
              onChange={(event) => setHomeQuery(event.target.value)}
              placeholder="Cerca modulo o sezione..."
              aria-label="Cerca modulo o sezione"
            />
          </form>

          <section style={{ display: "grid", gap: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>Preferiti</div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 10,
              }}
            >
              {favoriteItems.map((link) => renderLink(link, "favorite"))}
            </div>
          </section>

          <div>
            <button
              type="button"
              onClick={openDrawer}
              style={{
                border: "1px solid rgba(15, 23, 42, 0.12)",
                borderRadius: 14,
                background: "#0f172a",
                color: "#fff",
                fontSize: 14,
                fontWeight: 800,
                padding: "12px 16px",
                cursor: "pointer",
              }}
            >
              Tutte le sezioni
            </button>
          </div>
        </div>
      </section>

      {drawerOpen
        ? createPortal(
            <div
              role="presentation"
              onClick={() => setDrawerOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 1000,
                background: "rgba(15, 23, 42, 0.48)",
                padding: "24px",
                display: "flex",
                alignItems: "stretch",
                justifyContent: "center",
              }}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Tutte le sezioni"
                onClick={(event) => event.stopPropagation()}
                style={{
                  width: "min(980px, 100%)",
                  maxHeight: "92vh",
                  background: "#f8fafc",
                  borderRadius: 24,
                  boxShadow: "0 24px 80px rgba(15, 23, 42, 0.22)",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "20px 24px 16px",
                    borderBottom: "1px solid rgba(15, 23, 42, 0.08)",
                    background: "#fff",
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 16,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>
                      Tutte le sezioni
                    </div>
                    <div style={{ marginTop: 4, fontSize: 13, color: "#64748b" }}>
                      Una sola sezione aperta per volta, con accessi diretti ai moduli NEXT
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                    style={{
                      border: "1px solid rgba(15, 23, 42, 0.12)",
                      borderRadius: 999,
                      background: "#fff",
                      color: "#0f172a",
                      fontSize: 12,
                      fontWeight: 800,
                      padding: "8px 12px",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    Chiudi
                  </button>
                </div>

                <div
                  style={{
                    padding: "20px 24px 24px",
                    overflowY: "auto",
                    display: "grid",
                    gap: 18,
                  }}
                >
                  <input
                    className="quick-search-input"
                    value={overlayQuery}
                    onChange={(event) => setOverlayQuery(event.target.value)}
                    placeholder="Cerca modulo o sezione..."
                    aria-label="Cerca modulo o sezione nel menu completo"
                  />

                  {normalizedOverlayQuery ? (
                    <div style={{ display: "grid", gap: 10 }}>
                      {searchResults.length > 0 ? (
                        searchResults.map((link) => renderLink(link, "default"))
                      ) : (
                        <div className="quick-empty">Nessun risultato</div>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: "grid", gap: 10 }}>
                      {sections.map((section) => {
                        const isOpen = openSectionId === section.id;
                        return (
                          <div
                            key={section.id}
                            style={{
                              border: "1px solid rgba(15, 23, 42, 0.08)",
                              borderRadius: 16,
                              background: "#fff",
                              overflow: "hidden",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setOpenSectionId((prev) => (prev === section.id ? prev : section.id))
                              }
                              style={{
                                width: "100%",
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                padding: "14px 16px",
                                border: "none",
                                background: "transparent",
                                cursor: "pointer",
                                textAlign: "left",
                              }}
                            >
                              <span
                                style={{ flex: 1, fontSize: 15, fontWeight: 800, color: "#0f172a" }}
                              >
                                {section.title}
                              </span>
                              <span style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>
                                {section.links.length}
                              </span>
                              <span
                                style={{
                                  fontSize: 13,
                                  fontWeight: 800,
                                  color: "#475569",
                                  transform: isOpen ? "rotate(90deg)" : "none",
                                  transition: "transform 160ms ease",
                                }}
                              >
                                &gt;
                              </span>
                            </button>
                            {isOpen ? (
                              <div
                                style={{
                                  padding: "0 16px 14px",
                                  display: "grid",
                                  gap: 6,
                                  borderTop: "1px solid rgba(15, 23, 42, 0.08)",
                                }}
                              >
                                {section.links.map((link) => renderLink(link, "default"))}
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}

export default QuickNavigationCard;
