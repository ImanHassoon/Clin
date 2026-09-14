import fs from "fs";
import path from "path";
import crypto from "crypto";
import { env } from "../config/env";
import { StorageAdapter, StoredFile } from "./storageAdapter";

const SIGNING_SECRET = env.jwtAccessSecret; // dev-only reuse; use a dedicated secret in prod

function sign(storageKey: string, expires: number): string {
  return crypto.createHmac("sha256", SIGNING_SECRET).update(`${storageKey}:${expires}`).digest("hex");
}

export function verifyFileSignature(storageKey: string, expires: number, sig: string): boolean {
  if (Date.now() > expires) return false;
  const expected = sign(storageKey, expires);
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

export class LocalStorageAdapter implements StorageAdapter {
  private readonly baseDir: string;

  constructor(baseDir: string = env.uploadDir) {
    this.baseDir = path.resolve(baseDir);
    fs.mkdirSync(this.baseDir, { recursive: true });
  }

  async save(buffer: Buffer, originalName: string, mimeType: string): Promise<StoredFile> {
    const ext = path.extname(originalName).slice(0, 10);
    const storageKey = `${crypto.randomUUID()}${ext}`;
    const dest = path.join(this.baseDir, storageKey);
    await fs.promises.writeFile(dest, buffer);
    return { storageKey, mimeType, sizeBytes: buffer.length };
  }

  async getSignedUrl(storageKey: string, expiresInSeconds = 300): Promise<string> {
    const expires = Date.now() + expiresInSeconds * 1000;
    const sig = sign(storageKey, expires);
    return `/api/v1/files/${storageKey}?expires=${expires}&sig=${sig}`;
  }

  resolvePath(storageKey: string): string {
    return path.join(this.baseDir, storageKey);
  }
}

export const storageAdapter = new LocalStorageAdapter();
