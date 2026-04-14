let pendingFile: File | null = null;

export function setPendingMergeFile(file: File): void {
  pendingFile = file;
}

export function consumePendingMergeFile(): File | null {
  const file = pendingFile;
  pendingFile = null;
  return file;
}

export function clearPendingMergeFile(): void {
  pendingFile = null;
}
