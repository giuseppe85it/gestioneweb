export type NextAutistiCloneAttachment = {
  id: string;
  name: string;
  type: string;
  size: number;
  previewUrl: string;
  source: "next-clone-local";
};

function genId() {
  const cryptoApi = globalThis.crypto as Crypto | undefined;
  if (cryptoApi?.randomUUID) {
    return cryptoApi.randomUUID();
  }

  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Preview locale non disponibile"));
    };

    reader.onerror = () => {
      reject(reader.error ?? new Error("Errore lettura file locale"));
    };

    reader.readAsDataURL(file);
  });
}

export async function createNextAutistiCloneAttachmentFromFile(
  file: File,
): Promise<NextAutistiCloneAttachment> {
  const previewUrl = await readFileAsDataUrl(file);

  return {
    id: genId(),
    name: file.name || "allegato",
    type: file.type || "application/octet-stream",
    size: Number.isFinite(file.size) ? file.size : 0,
    previewUrl,
    source: "next-clone-local",
  };
}

export function formatNextAutistiCloneAttachmentSize(size: number): string {
  if (!Number.isFinite(size) || size <= 0) {
    return "0 KB";
  }

  if (size < 1024) {
    return `${size} B`;
  }

  const kb = size / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }

  return `${(kb / 1024).toFixed(1)} MB`;
}
