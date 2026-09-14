export interface StoredFile {
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
}

/**
 * Abstraction over "where uploaded files (X-rays, lab docs) actually live."
 * The API and DB only ever deal in storageKey + signed URLs — swapping the
 * dev LocalStorageAdapter for an S3-backed one means implementing this
 * interface, nothing else changes.
 */
export interface StorageAdapter {
  save(buffer: Buffer, originalName: string, mimeType: string): Promise<StoredFile>;
  /** Returns a URL usable for a limited time, never a permanent public link. */
  getSignedUrl(storageKey: string, expiresInSeconds?: number): Promise<string>;
}
