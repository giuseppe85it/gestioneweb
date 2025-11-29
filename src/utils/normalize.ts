export function normalizeFirestore<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map((item) => normalizeFirestore(item)) as T;
  }

  if (obj !== null && typeof obj === "object") {
    const clean: any = {};
    for (const k in obj) {
      const v = (obj as any)[k];
      clean[k] =
        v === undefined
          ? null
          : normalizeFirestore(v);
    }
    return clean as T;
  }

  return obj;
}
