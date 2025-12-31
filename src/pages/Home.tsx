import "./Home.css";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { getItemSync, } from "../utils/storageSync";

const MEZZI_KEY = "@mezzi_aziendali";
const SESSIONI_KEY = "@autisti_sessione_attive";
const EVENTI_KEY = "@storico_eventi_operativi";

type MezzoRecord = {
  id?: string;
  targa?: string;
  categoria?: string;
  autistaNome?: string | null;
  marca?: string;
  modello?: string;
  dataImmatricolazione?: string;
  dataUltimoCollaudo?: string;
  dataScadenzaRevisione?: string;
  manutenzioneProgrammata?: boolean;
  manutenzioneDataFine?: string;
};

type SessioneRecord = {
  targaMotrice?: string | null;
  targaRimorchio?: string | null;
  nomeAutista?: string;
  badgeAutista?: string;
  timestamp?: number;
};

type AutistaSuggestion = {
  name: string;
  badge?: string;
  targa?: string;
  priority: number;
};

type EventoOperativo = {
  timestamp?: number;
  luogo?: string | null;
  prima?: {
    targaRimorchio?: string | null;
    rimorchio?: string | null;
  };
  dopo?: {
    targaRimorchio?: string | null;
    rimorchio?: string | null;
  };
  primaRimorchio?: string | null;
  dopoRimorchio?: string | null;
};

const QUICK_LINKS_OPERATIVO = [
  { to: "/gestione-operativa", label: "Gestione Operativa" },
  { to: "/attrezzature-cantieri", label: "Attrezzature Cantieri" },
  { to: "/autisti-admin", label: "Autisti Admin" },
  { to: "/autisti-inbox", label: "Autisti Inbox" },
  { to: "/autisti-inbox/cambio-mezzo", label: "Cambio Mezzo Inbox" },
  { to: "/autisti-inbox/controlli", label: "Controlli Inbox" },
  { to: "/autisti-inbox/segnalazioni", label: "Segnalazioni Inbox" },
  { to: "/autisti-inbox/richiesta-attrezzature", label: "Richieste Attrezzature Inbox" },
  { to: "/autisti-inbox/gomme", label: "Gomme Inbox" },
  { to: "/manutenzioni", label: "Manutenzioni" },
  { to: "/lavori-da-eseguire", label: "Lavori Da Eseguire" },
  { to: "/lavori-eseguiti", label: "Lavori Eseguiti" },
  { to: "/lavori-in-attesa", label: "Lavori In Attesa" },
  { to: "/materiali-da-ordinare", label: "Materiali Da Ordinare" },
  { to: "/materiali-consegnati", label: "Materiali Consegnati" },
  { to: "/inventario", label: "Inventario" },
  { to: "/ordini-arrivati", label: "Ordini Arrivati" },
  { to: "/ordini-in-attesa", label: "Ordini In Attesa" },
  { to: "/ia", label: "IA" },
  { to: "/ia/libretto", label: "IA Libretto" },
  { to: "/ia/documenti", label: "IA Documenti" },
];

const QUICK_LINKS_ANAGRAFICHE = [
  { to: "/mezzi", label: "Mezzi" },
  { to: "/dossiermezzi", label: "Dossier Mezzi" },
  { to: "/colleghi", label: "Colleghi" },
  { to: "/fornitori", label: "Fornitori" },
  { to: "/autisti", label: "Autisti App" },
];

function unwrapList(value: any): any[] {
  if (Array.isArray(value)) return value;
  if (value && Array.isArray(value.value)) return value.value;
  if (value && Array.isArray(value.items)) return value.items;
  return [];
}

function fmtTarga(value: string | null | undefined): string {
  return String(value || "").trim().toUpperCase();
}

function normalizeName(value: string | null | undefined): string {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeNameKey(value: string | null | undefined): string {
  return normalizeName(value).toLowerCase();
}

function normalizeBadge(value: string | null | undefined): string {
  return String(value || "").trim();
}

function normalizeBadgeKey(value: string | null | undefined): string {
  return normalizeBadge(value).toLowerCase();
}

function buildDate(yyyyStr: string, mmStr: string, ddStr: string): Date | null {
  const yyyy = Number(yyyyStr);
  const mm = Number(mmStr);
  const dd = Number(ddStr);
  if (!Number.isFinite(yyyy) || !Number.isFinite(mm) || !Number.isFinite(dd)) {
    return null;
  }
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  const date = new Date(yyyy, mm - 1, dd, 12, 0, 0, 0);
  if (
    date.getFullYear() !== yyyy ||
    date.getMonth() !== mm - 1 ||
    date.getDate() !== dd
  ) {
    return null;
  }
  return date;
}

function parseDateFlexible(value: string | null | undefined): Date | null {
  if (!value) return null;
  const text = String(value).trim();
  if (!text) return null;

  const isoMatch = /(\d{4})-(\d{2})-(\d{2})/.exec(text);
  const dmyMatch = /(\d{2})[./\s](\d{2})[./\s](\d{4})/.exec(text);

  const candidates: Array<{ index: number; date: Date }> = [];
  if (isoMatch) {
    const date = buildDate(isoMatch[1], isoMatch[2], isoMatch[3]);
    if (date) candidates.push({ index: isoMatch.index, date });
  }
  if (dmyMatch) {
    const date = buildDate(dmyMatch[3], dmyMatch[2], dmyMatch[1]);
    if (date) candidates.push({ index: dmyMatch.index, date });
  }

  if (!candidates.length) return null;
  candidates.sort((a, b) => a.index - b.index);
  return candidates[0].date;
}

function formatDateForDisplay(date: Date | null): string {
  if (!date) return "-";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

// Revisione automatica (copiata da Mezzi.tsx)
function calculaProssimaRevisione(
  dataImmatricolazione: Date | null,
  dataUltimoCollaudo: Date | null
): Date | null {
  if (!dataImmatricolazione) {
    return dataUltimoCollaudo ? new Date(dataUltimoCollaudo) : null;
  }

  const immDate = new Date(dataImmatricolazione);
  immDate.setHours(12, 0, 0, 0);

  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const firstRevision = new Date(immDate);
  firstRevision.setFullYear(firstRevision.getFullYear() + 4);

  if (!dataUltimoCollaudo) {
    if (firstRevision > today) {
      return firstRevision;
    }

    const afterFirst = new Date(firstRevision);
    while (afterFirst <= today) {
      afterFirst.setFullYear(afterFirst.getFullYear() + 2);
    }
    return afterFirst;
  }

  const lastCollaudo = new Date(dataUltimoCollaudo);
  lastCollaudo.setHours(12, 0, 0, 0);

  const nextFromCollaudo = new Date(lastCollaudo);
  nextFromCollaudo.setFullYear(nextFromCollaudo.getFullYear() + 2);

  const nextFromImmatricolazione = new Date(immDate);
  while (nextFromImmatricolazione <= today) {
    nextFromImmatricolazione.setFullYear(
      nextFromImmatricolazione.getFullYear() + 2
    );
  }

  return nextFromCollaudo > nextFromImmatricolazione
    ? nextFromCollaudo
    : nextFromImmatricolazione;
}

function giorniDaOggi(target: Date | null): number | null {
  if (!target) return null;
  const today = new Date();
  const utcToday = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const utcTarget = Date.UTC(
    target.getFullYear(),
    target.getMonth(),
    target.getDate()
  );
  return Math.round((utcTarget - utcToday) / 86400000);
}

function isRimorchioCategoria(categoria?: string | null): boolean {
  const value = String(categoria || "").toLowerCase();
  if (!value) return false;
  const keywords = [
    "rimorchio",
    "semirimorchio",
    "biga",
    "pianale",
    "centina",
    "vasca",
    "carrello",
  ];
  return keywords.some((k) => value.includes(k));
}

function Home() {
  const navigate = useNavigate();
  const nameSuggestRef = useRef<HTMLDivElement | null>(null);
  const [mezzi, setMezzi] = useState<MezzoRecord[]>([]);
  const [sessioni, setSessioni] = useState<SessioneRecord[]>([]);
  const [eventi, setEventi] = useState<EventoOperativo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [badgeQuery, setBadgeQuery] = useState("");
  const [nameQuery, setNameQuery] = useState("");
  const [nameSuggestOpen, setNameSuggestOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const [mezziRaw, sessioniRaw, eventiRaw] = await Promise.all([
          getItemSync(MEZZI_KEY),
          getItemSync(SESSIONI_KEY),
          getItemSync(EVENTI_KEY),
        ]);
        if (!mounted) return;
        setMezzi(unwrapList(mezziRaw));
        setSessioni(unwrapList(sessioniRaw));
        setEventi(unwrapList(eventiRaw));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const handleAutistaSearch = () => {
    const badgeValue = badgeQuery.trim();
    if (badgeValue) {
      navigate(`/autista-360/${encodeURIComponent(badgeValue)}`);
      return;
    }
    const nameValue = nameQuery.trim();
    if (!nameValue) return;
    navigate(`/autista-360?nome=${encodeURIComponent(nameValue)}`);
  };

  const handleNameChange = (value: string) => {
    setNameQuery(value);
    const normalized = normalizeNameKey(value);
    if (normalized.length >= 2) {
      setNameSuggestOpen(true);
    } else {
      setNameSuggestOpen(false);
    }
  };

  const handleNameSuggestion = (suggestion: AutistaSuggestion) => {
    setNameQuery(suggestion.name);
    setBadgeQuery(suggestion.badge || "");
    setNameSuggestOpen(false);
  };

  useEffect(() => {
    if (!nameSuggestOpen) return;
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target || !nameSuggestRef.current) return;
      if (nameSuggestRef.current.contains(target)) return;
      setNameSuggestOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [nameSuggestOpen]);

  const mezzoByTarga = useMemo(() => {
    const map = new Map<string, MezzoRecord>();
    mezzi.forEach((m) => {
      const targa = fmtTarga(m.targa);
      if (targa) map.set(targa, m);
    });
    return map;
  }, [mezzi]);

  const getTargaTooltip = (targa: string | null | undefined) => {
    const key = fmtTarga(targa);
    if (!key) return "";
    const mezzo = mezzoByTarga.get(key);
    if (!mezzo) return "";
    const categoria = mezzo.categoria ? String(mezzo.categoria) : "-";
    const autista = mezzo.autistaNome ? String(mezzo.autistaNome) : "-";
    return `Categoria: ${categoria}\nAutista: ${autista}`;
  };

  const searchResults = useMemo(() => {
    const queryRaw = searchQuery.trim();
    if (!queryRaw) return [];
    const queryLower = queryRaw.toLowerCase();
    const queryUpper = queryRaw.toUpperCase();
    return mezzi
      .map((m) => {
        const targa = fmtTarga(m.targa);
        return {
          targa,
          autistaNome: m.autistaNome || "",
          categoria: m.categoria || "",
          marca: m.marca || "",
          modello: m.modello || "",
        };
      })
      .filter((m) => {
        if (!m.targa) return false;
        const targaMatch = m.targa.includes(queryUpper);
        const autistaMatch = String(m.autistaNome || "")
          .toLowerCase()
          .includes(queryLower);
        return targaMatch || autistaMatch;
      })
      .slice(0, 8);
  }, [mezzi, searchQuery]);

  const allAutistaSuggestions = useMemo(() => {
    const map = new Map<string, AutistaSuggestion>();
    const addCandidate = (
      nameRaw: string | null | undefined,
      badgeRaw: string | null | undefined,
      targaRaw: string | null | undefined,
      priority: number
    ) => {
      const nameLabel = normalizeName(nameRaw);
      if (!nameLabel) return;
      const badgeLabel = normalizeBadge(badgeRaw);
      const badgeKey = normalizeBadgeKey(badgeLabel);
      const nameKey = normalizeNameKey(nameLabel);
      const key = badgeKey ? `${nameKey}|${badgeKey}` : nameKey;
      const targaLabel = targaRaw ? fmtTarga(targaRaw) : "";
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          name: nameLabel,
          badge: badgeLabel || undefined,
          targa: targaLabel || undefined,
          priority,
        });
        return;
      }
      if (priority > existing.priority && nameLabel) {
        existing.name = nameLabel;
        existing.priority = priority;
      }
      if (!existing.badge && badgeLabel) {
        existing.badge = badgeLabel;
      }
      if (targaLabel && (!existing.targa || priority > existing.priority)) {
        existing.targa = targaLabel;
      }
    };

    sessioni.forEach((s) => {
      addCandidate(
        s.nomeAutista,
        s.badgeAutista,
        s.targaMotrice || s.targaRimorchio,
        2
      );
    });

    mezzi.forEach((m) => {
      const mezzoBadge =
        (m as any)?.badgeAutista || (m as any)?.badge || (m as any)?.autistaBadge;
      addCandidate(m.autistaNome, mezzoBadge, m.targa, 1);
    });

    return Array.from(map.values());
  }, [sessioni, mezzi]);

  const nameQueryKey = useMemo(() => normalizeNameKey(nameQuery), [nameQuery]);

  const nameSuggestions = useMemo(() => {
    if (nameQueryKey.length < 2) return [];
    return allAutistaSuggestions
      .filter((s) => normalizeNameKey(s.name).includes(nameQueryKey))
      .sort((a, b) => {
        if (a.priority !== b.priority) return b.priority - a.priority;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 8);
  }, [allAutistaSuggestions, nameQueryKey]);

  const showNameSuggestions = nameSuggestOpen && nameSuggestions.length > 0;

  const rimorchi = useMemo(() => {
    const inUso = new Set(
      sessioni
        .map((s) => fmtTarga(s.targaRimorchio))
        .filter((t) => t.length > 0)
    );

    const ultimoLuogo = new Map<string, { timestamp: number; luogo: string | null }>();
    eventi.forEach((evt) => {
      const ts = typeof evt?.timestamp === "number" ? evt.timestamp : 0;
      const rawLuogo = typeof evt?.luogo === "string" ? evt.luogo.trim() : "";
      const luogo = rawLuogo || null;

      const targas = new Set<string>();
      const prima = fmtTarga(
        evt?.prima?.targaRimorchio ?? evt?.prima?.rimorchio ?? evt?.primaRimorchio
      );
      const dopo = fmtTarga(
        evt?.dopo?.targaRimorchio ?? evt?.dopo?.rimorchio ?? evt?.dopoRimorchio
      );
      if (prima) targas.add(prima);
      if (dopo) targas.add(dopo);

      targas.forEach((targa) => {
        const prev = ultimoLuogo.get(targa);
        if (!prev || ts > prev.timestamp) {
          ultimoLuogo.set(targa, { timestamp: ts, luogo });
        }
      });
    });

    return mezzi
      .filter((m) => isRimorchioCategoria(m.categoria))
      .map((m) => {
        const targa = fmtTarga(m.targa);
        const inUsoRimorchio = targa ? inUso.has(targa) : false;
        const luogo = !inUsoRimorchio
          ? ultimoLuogo.get(targa)?.luogo || "Luogo non impostato"
          : "Sessione attiva";
        return {
          targa,
          categoria: m.categoria || "-",
          autistaNome: m.autistaNome || null,
          inUso: inUsoRimorchio,
          luogo,
        };
      })
      .sort((a, b) => {
        if (a.inUso !== b.inUso) return a.inUso ? -1 : 1;
        return a.targa.localeCompare(b.targa);
      });
  }, [mezzi, sessioni, eventi]);

  const sessioniAttive = useMemo(() => sessioni.slice(0, 6), [sessioni]);

  const revisioni = useMemo(() => {
    return mezzi.map((m) => {
      const scadenzaPrimaria = parseDateFlexible(m.dataScadenzaRevisione || "");
      const immDate = parseDateFlexible(m.dataImmatricolazione || "");
      const collaudoDate = parseDateFlexible(m.dataUltimoCollaudo || "");
      const computed = calculaProssimaRevisione(immDate, collaudoDate);
      const scadenza = scadenzaPrimaria ?? computed;
      const giorni = giorniDaOggi(scadenza);
      let classe = "";
      if (giorni !== null && giorni <= 30) {
        classe = "deadline-danger";
      }
      return {
        targa: fmtTarga(m.targa),
        marca: m.marca || "",
        modello: m.modello || "",
        scadenza,
        giorni,
        classe,
      };
    });
  }, [mezzi]);

  const revisioniUrgenti = useMemo(() => {
    return revisioni
      .filter((r) => r.giorni !== null)
      .sort((a, b) => (a.giorni ?? 0) - (b.giorni ?? 0))
      .slice(0, 6);
  }, [revisioni]);

  const revCounts = useMemo(() => {
    const valid = revisioni.filter((r) => r.giorni !== null);
    const scadute = valid.filter((r) => (r.giorni ?? 0) < 0).length;
    const inScadenza = valid.filter(
      (r) => (r.giorni ?? 0) >= 0 && (r.giorni ?? 0) <= 30
    ).length;
    return { scadute, inScadenza };
  }, [revisioni]);

  return (
    <div className="home-container">
      <div className="home-shell">
        <header className="home-hero">
          <div className="home-hero-left">
            <div className="home-kicker">Centrale Operativa</div>
            <h1 className="home-title">Dashboard Admin</h1>
            <p className="home-subtitle">
              Panoramica rapida su rimorchi, sessioni attive e revisioni. Tutti i pannelli
              portano alle sezioni operative.
            </p>
          </div>
          <div className="home-hero-logo">
            <img src="/logo.png" alt="Logo" />
          </div>
          <div className="home-hero-right">
            <Link to="/autisti-admin" className="hero-card">
              <div className="hero-card-title">Autisti Admin</div>
              <div className="hero-card-value">Centro Rettifica</div>
            </Link>
            <Link to="/mezzi" className="hero-card">
              <div className="hero-card-title">Mezzi</div>
              <div className="hero-card-value">Anagrafiche</div>
            </Link>
            <Link to="/manutenzioni" className="hero-card">
              <div className="hero-card-title">Manutenzioni</div>
              <div className="hero-card-value">Registro</div>
            </Link>
            <Link to="/autisti-inbox" className="hero-card">
              <div className="hero-card-title">Autisti Inbox</div>
              <div className="hero-card-value">Operativita</div>
            </Link>
          </div>
        </header>

        <div className="home-dashboard">
          <section className="panel panel-search" style={{ animationDelay: "40ms" }}>
            <div className="panel-head">
              <div>
                <h2>Ricerca 360</h2>
                <span>Cerca targa o autista e apri la Vista Mezzo 360</span>
              </div>
            </div>
            <div className="search-field">
              <input
                className="search-input"
                type="text"
                placeholder="Cerca targa o autista"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="search-results">
              {loading ? (
                <div className="search-empty">Caricamento dati...</div>
              ) : !searchQuery.trim() ? (
                <div className="search-empty">Digita per cercare</div>
              ) : searchResults.length === 0 ? (
                <div className="search-empty">Nessun risultato</div>
              ) : (
                searchResults.map((r, idx) => {
                  const tooltip = getTargaTooltip(r.targa);
                  return (
                    <Link
                      key={`${r.targa}-${idx}`}
                      to={`/mezzo-360/${encodeURIComponent(r.targa)}`}
                      className="search-item"
                    >
                      <div className="search-item-main">
                        <span className="targa" title={tooltip || undefined}>
                          {r.targa}
                        </span>
                        <span className="search-meta">
                          {r.autistaNome ? `Autista: ${r.autistaNome}` : "Autista: -"}
                        </span>
                      </div>
                      <span className="row-arrow">-&gt;</span>
                    </Link>
                  );
                })
              )}
            </div>
            <div className="badge-search">
              <div className="badge-search-label">Cerca badge</div>
              <div className="badge-search-form">
                <div className="badge-search-field">
                  <input
                    className="badge-search-input"
                    type="text"
                    placeholder="Inserisci badge"
                    value={badgeQuery}
                    onChange={(e) => setBadgeQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAutistaSearch();
                      }
                    }}
                  />
                </div>
                <div className="badge-search-field" ref={nameSuggestRef}>
                  <input
                    className="badge-search-input"
                    type="text"
                    placeholder="Nome autista..."
                    value={nameQuery}
                    onChange={(e) => handleNameChange(e.target.value)}
                    onFocus={() => {
                      if (nameQueryKey.length >= 2) setNameSuggestOpen(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        e.preventDefault();
                        setNameSuggestOpen(false);
                        return;
                      }
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAutistaSearch();
                      }
                    }}
                  />
                  {showNameSuggestions ? (
                    <div className="badge-suggest">
                      {nameSuggestions.map((suggestion) => (
                        <button
                          key={`${suggestion.name}-${suggestion.badge || "no-badge"}`}
                          type="button"
                          className="badge-suggest-item"
                          onClick={() => handleNameSuggestion(suggestion)}
                        >
                          <div className="badge-suggest-main">
                            <span className="badge-suggest-name">{suggestion.name}</span>
                            <span className="badge-suggest-meta">
                              {suggestion.badge ? `Badge ${suggestion.badge}` : "Badge -"}
                            </span>
                            {suggestion.targa ? (
                              <span className="badge-suggest-meta">
                                Targa {suggestion.targa}
                              </span>
                            ) : null}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="badge-search-button"
                  onClick={handleAutistaSearch}
                >
                  Apri
                </button>
              </div>
            </div>
          </section>

          <section className="panel panel-rimorchi" style={{ animationDelay: "60ms" }}>
            <div className="panel-head">
              <div>
                <h2>Rimorchi: dove sono</h2>
                <span>Ultimo luogo da storico eventi</span>
              </div>
              <Link to="/autisti-admin" className="panel-link">
                Apri Autisti Admin
              </Link>
            </div>
            <div className="panel-body">
              {loading ? (
                <Link to="/autisti-admin" className="panel-row panel-row-empty">
                  Caricamento dati...
                </Link>
              ) : rimorchi.length === 0 ? (
                <Link to="/autisti-admin" className="panel-row panel-row-empty">
                  Nessun rimorchio trovato
                </Link>
              ) : (
                rimorchi.slice(0, 6).map((r, idx) => {
                  const tooltip = getTargaTooltip(r.targa);
                  return (
                    <Link
                      key={r.targa || `rim-${idx}`}
                      to="/autisti-admin"
                      className="panel-row"
                    >
                      <div className="row-main">
                        <div className="row-title">
                          <span className="targa" title={tooltip || undefined}>
                            {r.targa || "-"}
                          </span>
                          <span className={`status ${r.inUso ? "in-uso" : "sganciato"}`}>
                            {r.inUso ? "IN USO" : "SGANCIATO"}
                          </span>
                        </div>
                        <div className="row-meta">{r.luogo}</div>
                      </div>
                      <span className="row-arrow">-&gt;</span>
                    </Link>
                  );
                })
              )}
            </div>
          </section>

          <section className="panel panel-sessioni" style={{ animationDelay: "120ms" }}>
            <div className="panel-head">
              <div>
                <h2>Sessioni attive</h2>
                <span>Ultime 6 sessioni live</span>
              </div>
              <Link to="/autisti-inbox" className="panel-link">
                Gestisci sessioni
              </Link>
            </div>
            <div className="panel-body">
              {loading ? (
                <Link to="/autisti-inbox" className="panel-row panel-row-empty">
                  Caricamento dati...
                </Link>
              ) : sessioniAttive.length === 0 ? (
                <Link to="/autisti-inbox" className="panel-row panel-row-empty">
                  Nessuna sessione attiva
                </Link>
              ) : (
                sessioniAttive.map((s, idx) => {
                  const motrice = fmtTarga(s.targaMotrice);
                  const rimorchio = fmtTarga(s.targaRimorchio);
                  const badgeValue = String(s.badgeAutista || "").trim();
                  const profilePath = badgeValue
                    ? `/autista-360/${encodeURIComponent(badgeValue)}`
                    : "";
                  return (
                    <div
                      key={`${s.badgeAutista || "s"}-${idx}`}
                      className="panel-row panel-row-link"
                      role="link"
                      tabIndex={0}
                      onClick={() => navigate("/autisti-inbox")}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          navigate("/autisti-inbox");
                        }
                      }}
                    >
                      <div className="row-main">
                        <div className="row-title">
                          <span>{s.nomeAutista || "Autista"}</span>
                          <span className="badge">badge {s.badgeAutista || "-"}</span>
                          {badgeValue ? (
                            <button
                              type="button"
                              className="session-profile-link"
                              onClick={(event) => {
                                event.stopPropagation();
                                navigate(profilePath);
                              }}
                            >
                              Profilo
                            </button>
                          ) : null}
                        </div>
                        <div className="row-meta">
                          <span className="label">Motrice:</span>{" "}
                          <span className="targa" title={getTargaTooltip(motrice) || undefined}>
                            {motrice || "-"}
                          </span>{" "}
                          <span className="label">Rimorchio:</span>{" "}
                          <span className="targa" title={getTargaTooltip(rimorchio) || undefined}>
                            {rimorchio || "-"}
                          </span>
                        </div>
                      </div>
                      <span className="row-arrow">-&gt;</span>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <section className="panel panel-revisioni" style={{ animationDelay: "180ms" }}>
            <div className="panel-head">
              <div>
                <h2>Revisioni</h2>
                <span>Allarmi basati su immatricolazione e ultimo collaudo</span>
              </div>
              <Link to="/mezzi" className="panel-link">
                Apri Mezzi
              </Link>
            </div>
            <div className="panel-stats">
              <div className="stat-chip">
                <span className="stat-label">Scadute</span>
                <span className="stat-value">{revCounts.scadute}</span>
              </div>
              <div className="stat-chip">
                <span className="stat-label">In scadenza</span>
                <span className="stat-value">{revCounts.inScadenza}</span>
              </div>
            </div>
            <div className="panel-body">
              {loading ? (
                <Link to="/mezzi" className="panel-row panel-row-empty">
                  Caricamento dati...
                </Link>
              ) : revisioniUrgenti.length === 0 ? (
                <Link to="/mezzi" className="panel-row panel-row-empty">
                  Nessuna revisione imminente
                </Link>
              ) : (
                revisioniUrgenti.map((r, idx) => {
                  const tooltip = getTargaTooltip(r.targa);
                  const giorniLabel =
                    r.giorni === null
                      ? "-"
                      : `${r.giorni > 0 ? "+" : ""}${r.giorni}g`;
                  const dossierPath = r.targa
                    ? `/dossiermezzi/${encodeURIComponent(r.targa)}`
                    : "/dossiermezzi";
                  return (
                    <Link
                      key={r.targa || `rev-${idx}`}
                      to={dossierPath}
                      className="panel-row"
                    >
                      <div className="row-main">
                        <div className="row-title">
                          <span className="targa" title={tooltip || undefined}>
                            {r.targa || "-"}
                          </span>
                          <span className={`status ${r.classe}`}>{giorniLabel}</span>
                        </div>
                        <div className="row-meta">
                          Scadenza {formatDateForDisplay(r.scadenza)}{" "}
                          {r.marca || r.modello ? `- ${r.marca} ${r.modello}`.trim() : ""}
                        </div>
                      </div>
                      <span className="row-arrow">-&gt;</span>
                    </Link>
                  );
                })
              )}
            </div>
          </section>

          <section className="panel panel-quick" style={{ animationDelay: "240ms" }}>
            <div className="panel-head">
              <div>
                <h2>Collegamenti rapidi</h2>
                <span>Tutte le sezioni in un click</span>
              </div>
              <Link to="/gestione-operativa" className="panel-link">
                Gestione Operativa
              </Link>
            </div>
            <div className="quick-sections">
              <div className="quick-section">
                <div className="quick-title">Operativo</div>
                <div className="quick-grid">
                  {QUICK_LINKS_OPERATIVO.map((link) => (
                    <Link key={link.to} to={link.to} className="quick-link">
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="quick-section">
                <div className="quick-title">Anagrafiche</div>
                <div className="quick-grid">
                  {QUICK_LINKS_ANAGRAFICHE.map((link) => (
                    <Link key={link.to} to={link.to} className="quick-link">
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default Home;
