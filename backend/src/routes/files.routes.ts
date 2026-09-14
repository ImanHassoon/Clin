import { Router } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { HttpError } from "../middleware/errorHandler";
import { storageAdapter, verifyFileSignature } from "../storage/localStorageAdapter";

export const filesRouter = Router();

/**
 * Serves a file by its signed URL (storageKey + expires + sig), the same
 * way an S3 presigned GET would. No Authorization header is required here
 * on purpose — the signature IS the access control, and it is short-lived
 * and single-purpose (tied to one storageKey), unlike a permanent public link.
 */
filesRouter.get(
  "/:key",
  asyncHandler(async (req, res) => {
    const { key } = req.params;
    const expires = Number(req.query.expires);
    const sig = String(req.query.sig ?? "");

    if (!expires || !sig || !verifyFileSignature(key, expires, sig)) {
      throw new HttpError(403, "Invalid or expired file link");
    }

    const document = await prisma.document.findFirst({ where: { storageKey: key } });
    if (!document) throw new HttpError(404, "File not found");

    res.setHeader("Content-Type", document.mimeType);
    res.setHeader("Cache-Control", "private, max-age=60");
    res.sendFile(storageAdapter.resolvePath(key));
  }),
);
