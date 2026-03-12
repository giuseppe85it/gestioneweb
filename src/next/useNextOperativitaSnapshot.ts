import { useEffect, useState } from "react";
import {
  readNextOperativitaGlobaleSnapshot,
  type NextOperativitaGlobaleSnapshot,
} from "./domain/nextOperativitaGlobaleDomain";

export function useNextOperativitaSnapshot() {
  const [snapshot, setSnapshot] = useState<NextOperativitaGlobaleSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const nextSnapshot = await readNextOperativitaGlobaleSnapshot();
        if (!mounted) return;
        setSnapshot(nextSnapshot);
      } catch (loadError) {
        console.error("Errore caricamento snapshot operativita clone:", loadError);
        if (!mounted) return;
        setSnapshot(null);
        setError("Impossibile leggere i dati read-only di Gestione Operativa.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  return { snapshot, loading, error };
}

