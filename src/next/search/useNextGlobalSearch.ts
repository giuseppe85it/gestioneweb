// Ricerca globale NEXT — indice unificato autisti + mezzi.
// Carica due dataset leggeri (anagrafica flotta + colleghi) una sola volta,
// con cache a livello di modulo, e li indicizza per una ricerca testuale
// con AND sui token e OR sui campi (stesso criterio di useArchivioSearch).
//
// Nessuna scrittura: tutti i reader usati sono in sola lettura clone-safe.

import { useCallback, useMemo, useRef, useState } from "react";

import { readNextAnagraficheFlottaSnapshot } from "../nextAnagraficheFlottaDomain";
import { readNextColleghiSnapshot } from "../domain/nextColleghiDomain";
import {
  buildNextSchedaAutistaPath,
  buildNextSchedaMezzoPath,
} from "../nextStructuralPaths";

export type NextGlobalSearchKind = "autista" | "mezzo";

export type NextGlobalSearchResult = {
  kind: NextGlobalSearchKind;
  id: string;
  label: string;
  sublabel: string;
  targetPath: string;
  searchTokens: string[];
};

type GlobalSearchIndex = {
  autisti: NextGlobalSearchResult[];
  mezzi: NextGlobalSearchResult[];
};

const MAX_PER_GROUP = 8;

let indexCache: GlobalSearchIndex | null = null;
let indexPromise: Promise<GlobalSearchIndex> | null = null;

function normalizeQuery(value: string): string {
  return value.trim().toLowerCase();
}

function tokenize(query: string): string[] {
  return query.split(/\s+/).filter((token) => token.length > 0);
}

function toTokens(values: Array<string | null | undefined>): string[] {
  return values
    .map((value) => (value ?? "").toString().trim().toLowerCase())
    .filter((value) => value.length > 0);
}

function matchTokens(searchTokens: string[], queryTokens: string[]): boolean {
  // AND sui token della query, OR sui campi indicizzati: ogni token deve
  // comparire in almeno uno dei campi del record.
  return queryTokens.every((token) =>
    searchTokens.some((field) => field.includes(token)),
  );
}

async function buildIndex(): Promise<GlobalSearchIndex> {
  const [flotta, colleghi] = await Promise.all([
    readNextAnagraficheFlottaSnapshot(),
    readNextColleghiSnapshot(),
  ]);

  const mezzi: NextGlobalSearchResult[] = flotta.items
    .filter((mezzo) => mezzo.targa.trim().length > 0)
    .map((mezzo) => {
      const categoria = mezzo.categoria?.trim() || "";
      const marcaModello = mezzo.marcaModello?.trim() || "";
      const sublabelParts = [categoria, marcaModello].filter(Boolean);
      return {
        kind: "mezzo" as const,
        id: mezzo.id || mezzo.targa,
        label: mezzo.targa,
        sublabel: sublabelParts.join(" · ") || "Mezzo",
        targetPath: buildNextSchedaMezzoPath(mezzo.targa),
        searchTokens: toTokens([
          mezzo.targa,
          categoria,
          marcaModello,
          mezzo.autistaNome,
        ]),
      };
    });

  const autisti: NextGlobalSearchResult[] = colleghi.items
    .filter((collega) => collega.nome.trim().length > 0)
    .map((collega) => {
      const badge = collega.badge?.trim() || "";
      const codice = collega.codice?.trim() || "";
      const sublabelParts: string[] = [];
      if (badge) sublabelParts.push(`badge ${badge}`);
      if (codice) sublabelParts.push(`cod. ${codice}`);
      return {
        kind: "autista" as const,
        id: collega.id,
        label: collega.nome,
        sublabel: sublabelParts.join(" · ") || "Autista",
        // Navigazione per badge quando presente, altrimenti fallback su id.
        targetPath: buildNextSchedaAutistaPath(badge || collega.id),
        searchTokens: toTokens([collega.nome, badge, codice]),
      };
    });

  return { autisti, mezzi };
}

async function loadIndex(): Promise<GlobalSearchIndex> {
  if (indexCache) return indexCache;
  if (!indexPromise) {
    indexPromise = buildIndex()
      .then((index) => {
        indexCache = index;
        return index;
      })
      .catch((error) => {
        indexPromise = null;
        throw error;
      });
  }
  return indexPromise;
}

export type UseNextGlobalSearchState = {
  query: string;
  setQuery: (value: string) => void;
  ensureLoaded: () => void;
  loading: boolean;
  error: boolean;
  autisti: NextGlobalSearchResult[];
  mezzi: NextGlobalSearchResult[];
  flat: NextGlobalSearchResult[];
  hasQuery: boolean;
  totalCount: number;
};

export function useNextGlobalSearch(): UseNextGlobalSearchState {
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState<GlobalSearchIndex | null>(indexCache);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const requestedRef = useRef(false);

  const ensureLoaded = useCallback(() => {
    if (index || requestedRef.current) return;
    requestedRef.current = true;
    setLoading(true);
    setError(false);
    loadIndex()
      .then((loaded) => {
        setIndex(loaded);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
        requestedRef.current = false;
      });
  }, [index]);

  const { autisti, mezzi } = useMemo(() => {
    if (!index) return { autisti: [], mezzi: [] };
    const tokens = tokenize(normalizeQuery(query));
    if (tokens.length === 0) return { autisti: [], mezzi: [] };
    return {
      autisti: index.autisti
        .filter((item) => matchTokens(item.searchTokens, tokens))
        .slice(0, MAX_PER_GROUP),
      mezzi: index.mezzi
        .filter((item) => matchTokens(item.searchTokens, tokens))
        .slice(0, MAX_PER_GROUP),
    };
  }, [index, query]);

  const flat = useMemo(() => [...autisti, ...mezzi], [autisti, mezzi]);
  const hasQuery = normalizeQuery(query).length > 0;

  return {
    query,
    setQuery,
    ensureLoaded,
    loading,
    error,
    autisti,
    mezzi,
    flat,
    hasQuery,
    totalCount: flat.length,
  };
}
