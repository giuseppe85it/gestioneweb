// Archivio Storico NEXT — Step 2 (PROMPT 29.7) — useArchivioData.
// Orchestra le 4 chiamate reader autorizzate (SPEC §4) in parallelo
// con strategy EAGER al mount (SPEC §4.4) e normalizza il risultato
// in `ArchivioRecordsByKind` (4 array discriminati). Sola lettura.
//
// Reader autorizzati (R0):
//   - readNextLavoriArchivioSnapshot     (nextLavoriDomain — Step 1)
//   - readNextManutenzioniLegacyDataset  (nextManutenzioniDomain)
//   - readNextAutistiReadOnlySnapshot    (nextAutistiDomain)

import { useCallback, useEffect, useMemo, useState } from "react";

import { readNextAutistiReadOnlySnapshot } from "../../../domain/nextAutistiDomain";
import { readNextLavoriArchivioSnapshot } from "../../../domain/nextLavoriDomain";
import { readNextManutenzioniLegacyDataset } from "../../../domain/nextManutenzioniDomain";
import { readNextAnagraficheFlottaSnapshot } from "../../../nextAnagraficheFlottaDomain";
import type {
  ArchivioRecord,
  ArchivioRecordsByKind,
} from "../archivioTypes";

export type ArchivioFlottaInfo = {
  fotoUrl: string | null;
  categoria: string | null;
};

export type ArchivioFlottaMap = Map<string, ArchivioFlottaInfo>;

export type UseArchivioDataState = {
  records: ArchivioRecordsByKind;
  flotta: ArchivioFlottaMap;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

const EMPTY_RECORDS: ArchivioRecordsByKind = {
  lavoro: [],
  manutenzione: [],
  segnalazione: [],
  richiesta: [],
};

const EMPTY_FLOTTA: ArchivioFlottaMap = new Map<string, ArchivioFlottaInfo>();

export const useArchivioData = (): UseArchivioDataState => {
  const [records, setRecords] = useState<ArchivioRecordsByKind>(EMPTY_RECORDS);
  const [flotta, setFlotta] = useState<ArchivioFlottaMap>(EMPTY_FLOTTA);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const [lavoriSnapshot, manutenzioniList, autistiSnapshot, flottaSnapshot] =
        await Promise.all([
          readNextLavoriArchivioSnapshot(),
          readNextManutenzioniLegacyDataset(),
          readNextAutistiReadOnlySnapshot(Date.now()),
          readNextAnagraficheFlottaSnapshot(),
        ]);

      const lavoroRecords: ArchivioRecord[] = lavoriSnapshot.groups.flatMap(
        (group) =>
          group.items.map((item) => ({
            kind: "lavoro" as const,
            data: item,
          })),
      );

      const manutenzioneRecords: ArchivioRecord[] = manutenzioniList.map(
        (item) => ({
          kind: "manutenzione" as const,
          data: item,
        }),
      );

      const segnalazioneRecords: ArchivioRecord[] =
        autistiSnapshot.segnalazioniRows.map((item) => ({
          kind: "segnalazione" as const,
          data: item,
        }));

      const richiestaRecords: ArchivioRecord[] =
        autistiSnapshot.richiesteRows.map((item) => ({
          kind: "richiesta" as const,
          data: item,
        }));

      const flottaMap: ArchivioFlottaMap = new Map<string, ArchivioFlottaInfo>();
      for (const item of flottaSnapshot.items) {
        const targaUp: string = String(item.targa ?? "").trim().toUpperCase();
        if (!targaUp) continue;
        if (!flottaMap.has(targaUp)) {
          flottaMap.set(targaUp, {
            fotoUrl: item.fotoUrl,
            categoria: item.categoria || null,
          });
        }
      }

      setRecords({
        lavoro: lavoroRecords,
        manutenzione: manutenzioneRecords,
        segnalazione: segnalazioneRecords,
        richiesta: richiestaRecords,
      });
      setFlotta(flottaMap);
    } catch (err: unknown) {
      const wrapped: Error =
        err instanceof Error
          ? err
          : new Error("Errore caricamento archivio storico.");
      setError(wrapped);
      setRecords(EMPTY_RECORDS);
      setFlotta(EMPTY_FLOTTA);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const state: UseArchivioDataState = useMemo(
    () => ({
      records,
      flotta,
      loading,
      error,
      refetch: fetchAll,
    }),
    [records, flotta, loading, error, fetchAll],
  );

  return state;
};
