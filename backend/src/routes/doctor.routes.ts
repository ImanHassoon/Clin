import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { asyncHandler } from "../utils/asyncHandler";
import { getDoctorProfileOrThrow } from "../services/access";
import { HttpError } from "../middleware/errorHandler";

export const doctorRouter = Router();
doctorRouter.use(requireAuth);

const doctorDirectorySelect = {
  id: true,
  specialty: true,
  bio: true,
  clinic: { select: { id: true, name: true, address: true } },
  user: { select: { firstName: true, lastName: true } },
} as const;

// Public-to-authenticated-users directory: only non-clinical info.
doctorRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const specialty = typeof req.query.specialty === "string" ? req.query.specialty : undefined;
    const doctors = await prisma.doctorProfile.findMany({
      where: specialty ? { specialty: { equals: specialty, mode: "insensitive" } } : undefined,
      select: doctorDirectorySelect,
      take: 50,
    });
    res.json({ doctors });
  }),
);

doctorRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: req.params.id },
      select: doctorDirectorySelect,
    });
    if (!doctor) throw new HttpError(404, "Doctor not found");
    res.json({ doctor });
  }),
);

// The doctor's own linked patients — this is the doctor-side "patient list" screen.
doctorRouter.get(
  "/me/patients",
  requireRole("DOCTOR"),
  asyncHandler(async (req, res) => {
    const doctor = await getDoctorProfileOrThrow(req.auth!.userId);
    const links = await prisma.doctorPatientLink.findMany({
      where: { doctorId: doctor.id, status: "ACTIVE" },
      include: {
        patient: { select: { id: true, user: { select: { firstName: true, lastName: true, email: true } } } },
      },
    });
    res.json({ patients: links.map((l) => l.patient) });
  }),
);
