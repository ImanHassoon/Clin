import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { asyncHandler } from "../utils/asyncHandler";
import { assertCanAccessPatient, assertDoctorOwnsVisit, getDoctorProfileOrThrow } from "../services/access";
import { HttpError } from "../middleware/errorHandler";
import { recordAudit } from "../utils/audit";
import { storageAdapter } from "../storage/localStorageAdapter";
import { env } from "../config/env";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "application/dicom", "application/pdf"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxUploadMb * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new HttpError(400, `Unsupported file type: ${file.mimetype}`) as unknown as Error);
    }
    cb(null, true);
  },
});

export const imagingRouter = Router();
imagingRouter.use(requireAuth);

const createSchema = z.object({
  visitId: z.string().uuid(),
  type: z.enum(["XRAY", "CT", "MRI", "ULTRASOUND", "OTHER"]),
  bodyPart: z.string().optional(),
  notes: z.string().optional(),
});

imagingRouter.post(
  "/",
  requireRole("DOCTOR"),
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new HttpError(400, "file is required");
    const body = createSchema.parse(req.body);

    const doctor = await getDoctorProfileOrThrow(req.auth!.userId);
    const visit = await assertDoctorOwnsVisit(doctor.id, body.visitId);

    const stored = await storageAdapter.save(req.file.buffer, req.file.originalname, req.file.mimetype);

    const study = await prisma.imagingStudy.create({
      data: {
        visitId: visit.id,
        patientId: visit.patientId,
        type: body.type,
        bodyPart: body.bodyPart,
        notes: body.notes,
        orderedById: doctor.id,
        performedAt: new Date(),
        documents: {
          create: {
            ownerType: "IMAGING_STUDY",
            storageKey: stored.storageKey,
            mimeType: stored.mimeType,
            sizeBytes: stored.sizeBytes,
            uploadedById: req.auth!.userId,
          },
        },
      },
      include: { documents: true },
    });

    const documents = await Promise.all(
      study.documents.map(async (doc) => ({
        id: doc.id,
        mimeType: doc.mimeType,
        url: await storageAdapter.getSignedUrl(doc.storageKey),
      })),
    );

    await recordAudit(req, { action: "IMAGING_UPLOAD", targetType: "ImagingStudy", targetId: study.id });
    res.status(201).json({ study: { ...study, documents } });
  }),
);

imagingRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const study = await prisma.imagingStudy.findUnique({ where: { id: req.params.id }, include: { documents: true } });
    if (!study) throw new HttpError(404, "Imaging study not found");
    await assertCanAccessPatient(req, study.patientId);

    const documents = await Promise.all(
      study.documents.map(async (doc) => ({
        id: doc.id,
        mimeType: doc.mimeType,
        url: await storageAdapter.getSignedUrl(doc.storageKey),
      })),
    );

    await recordAudit(req, { action: "IMAGING_VIEW", targetType: "ImagingStudy", targetId: study.id });
    res.json({ study: { ...study, documents } });
  }),
);

export const patientImagingRouter = Router();
patientImagingRouter.use(requireAuth);

// Mounted at /patients/:patientId/imaging
patientImagingRouter.get(
  "/:patientId/imaging",
  asyncHandler(async (req, res) => {
    await assertCanAccessPatient(req, req.params.patientId);
    const studies = await prisma.imagingStudy.findMany({
      where: { patientId: req.params.patientId },
      orderBy: { createdAt: "desc" },
      include: { documents: { select: { id: true, mimeType: true, uploadedAt: true } } },
    });
    res.json({ studies });
  }),
);
