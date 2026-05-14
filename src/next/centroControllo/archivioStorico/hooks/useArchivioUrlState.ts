// Archivio Storico NEXT — PROMPT 30.3 FASE 3 — useArchivioUrlState.
// Centralizza lettura/scrittura URL params per persistenza navigazionale:
//   - asTab=<manutenzione|segnalazione|richiesta>          sub-tab
//   - asAutista=<nome>                                     filtro autista
//   - asTarga=<targa>                                      filtro targa
//   - asPeriod=<7g|30g|90g|12m|all|custom>                 preset periodo
//   - asFrom=<ts>, asTo=<ts>                               se period=custom
//   - asQ=<query>                                          ricerca
// Prefix `as` (Archivio Storico) per non collidere con `tab` (page-tabbar CC)
// o altri params esistenti.

import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

import type { ArchivioRecordKind } from "../archivioTypes";

export type ArchivioUrlPeriodPreset =
  | "7g"
  | "30g"
  | "90g"
  | "12m"
  | "all"
  | "custom";

export type ArchivioUrlState = {
  subTab: ArchivioRecordKind;
  autista: string | null;
  targa: string | null;
  period: ArchivioUrlPeriodPreset;
  periodFrom: number | null;
  periodTo: number | null;
  q: string;
};

const VALID_KINDS: ReadonlySet<string> = new Set<string>([
  "manutenzione",
  "segnalazione",
  "richiesta",
]);

const VALID_PERIODS: ReadonlySet<string> = new Set<string>([
  "7g",
  "30g",
  "90g",
  "12m",
  "all",
  "custom",
]);

function parseKind(value: string | null): ArchivioRecordKind {
  if (value && VALID_KINDS.has(value)) return value as ArchivioRecordKind;
  return "manutenzione";
}

function parsePeriod(value: string | null): ArchivioUrlPeriodPreset {
  if (value && VALID_PERIODS.has(value)) return value as ArchivioUrlPeriodPreset;
  return "30g";
}

function parseNumber(value: string | null): number | null {
  if (!value) return null;
  const n: number = Number(value);
  return Number.isFinite(n) ? n : null;
}

export type UseArchivioUrlStateApi = {
  state: ArchivioUrlState;
  update: (partial: Partial<ArchivioUrlState>) => void;
};

export function useArchivioUrlState(): UseArchivioUrlStateApi {
  const [searchParams, setSearchParams] = useSearchParams();

  const state: ArchivioUrlState = {
    subTab: parseKind(searchParams.get("asTab")),
    autista: searchParams.get("asAutista") ?? null,
    targa: searchParams.get("asTarga") ?? null,
    period: parsePeriod(searchParams.get("asPeriod")),
    periodFrom: parseNumber(searchParams.get("asFrom")),
    periodTo: parseNumber(searchParams.get("asTo")),
    q: searchParams.get("asQ") ?? "",
  };

  const update = useCallback(
    (partial: Partial<ArchivioUrlState>): void => {
      setSearchParams(
        (prev: URLSearchParams) => {
          const next: URLSearchParams = new URLSearchParams(prev);
          const writeOrDelete = (
            key: string,
            value: string | null | undefined,
            defaultValue?: string,
          ): void => {
            if (value === null || value === undefined || value === "") {
              next.delete(key);
              return;
            }
            if (defaultValue !== undefined && value === defaultValue) {
              next.delete(key);
              return;
            }
            next.set(key, value);
          };
          if (Object.prototype.hasOwnProperty.call(partial, "subTab")) {
            writeOrDelete("asTab", partial.subTab ?? null, "manutenzione");
          }
          if (Object.prototype.hasOwnProperty.call(partial, "autista")) {
            writeOrDelete("asAutista", partial.autista ?? null);
          }
          if (Object.prototype.hasOwnProperty.call(partial, "targa")) {
            writeOrDelete("asTarga", partial.targa ?? null);
          }
          if (Object.prototype.hasOwnProperty.call(partial, "period")) {
            writeOrDelete("asPeriod", partial.period ?? null, "30g");
          }
          if (Object.prototype.hasOwnProperty.call(partial, "periodFrom")) {
            writeOrDelete(
              "asFrom",
              partial.periodFrom !== null && partial.periodFrom !== undefined
                ? String(partial.periodFrom)
                : null,
            );
          }
          if (Object.prototype.hasOwnProperty.call(partial, "periodTo")) {
            writeOrDelete(
              "asTo",
              partial.periodTo !== null && partial.periodTo !== undefined
                ? String(partial.periodTo)
                : null,
            );
          }
          if (Object.prototype.hasOwnProperty.call(partial, "q")) {
            writeOrDelete("asQ", partial.q ?? null);
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  return { state, update };
}
