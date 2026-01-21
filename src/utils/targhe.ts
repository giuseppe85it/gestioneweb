import { useEffect, useState } from "react";
import { getItemSync } from "./storageSync";

const MEZZI_KEY = "@mezzi_aziendali";

function normalizeTarga(value?: string | null) {
  return String(value ?? "").trim().toUpperCase();
}

export function buildTargheList(rawMezzi: any[]): string[] {
  const unique = new Set<string>();
  rawMezzi.forEach((m) => {
    const targa = normalizeTarga(
      m?.targa ?? m?.targaCamion ?? m?.targaMotrice ?? m?.targaRimorchio ?? ""
    );
    if (targa) unique.add(targa);
  });
  return Array.from(unique).sort((a, b) => a.localeCompare(b));
}

export async function getTarghe(): Promise<string[]> {
  const raw = await getItemSync(MEZZI_KEY);
  const list = Array.isArray(raw)
    ? raw
    : raw?.value && Array.isArray(raw.value)
    ? raw.value
    : [];
  return buildTargheList(list);
}

export function useTarghe(): string[] {
  const [targhe, setTarghe] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const list = await getTarghe();
      if (active) setTarghe(list);
    })();
    return () => {
      active = false;
    };
  }, []);

  return targhe;
}
