import { Request } from "express";
import { prisma } from "../lib/prisma";
import { HttpError } from "../middleware/errorHandler";

/**
 * Relationship-based access control: the piece RBAC alone can't express.
 * A DOCTOR role lets someone hit doctor-only routes, but it must NOT let
 * them read an arbitrary patient's records — only patients they have an
 * active care link (or explicit consent) with. These helpers are the
 * single place that decides that, so every controller enforces it the
 * same way and it's easy to audit.
 */

export async function getPatientProfileOrThrow(userId: string) {
  const profile = await prisma.patientProfile.findUnique({ where: { userId } });
  if (!profile) throw new HttpError(404, "Patient profile not found");
  return profile;
}

export async function getDoctorProfileOrThrow(userId: string) {
  const profile = await prisma.doctorProfile.findUnique({ where: { userId } });
  if (!profile) throw new HttpError(404, "Doctor profile not found");
  return profile;
}

async function hasActiveLinkOrConsent(doctorId: string, patientId: string): Promise<boolean> {
  const link = await prisma.doctorPatientLink.findUnique({
    where: { doctorId_patientId: { doctorId, patientId } },
  });
  if (link && link.status === "ACTIVE") return true;

  const consent = await prisma.consent.findFirst({
    where: { patientId, doctorId, revokedAt: null },
  });
  return Boolean(consent);
}

/**
 * Ensures the authenticated user may access `patientId`'s clinical data:
 * either they ARE that patient, or they're a doctor with an active link /
 * consent grant. Returns the resolved patientProfileId for convenience.
 * Throws 403 otherwise. Callers should still write an AuditLog entry.
 */
export async function assertCanAccessPatient(req: Request, patientId: string): Promise<void> {
  if (!req.auth) throw new HttpError(401, "Not authenticated");

  if (req.auth.role === "PATIENT") {
    const own = await getPatientProfileOrThrow(req.auth.userId);
    if (own.id !== patientId) {
      throw new HttpError(403, "Patients may only access their own records");
    }
    return;
  }

  if (req.auth.role === "DOCTOR") {
    const doctor = await getDoctorProfileOrThrow(req.auth.userId);
    const allowed = await hasActiveLinkOrConsent(doctor.id, patientId);
    if (!allowed) {
      throw new HttpError(
        403,
        "This patient has not granted you access. Use the emergency-access endpoint with a reason if this is urgent.",
      );
    }
    return;
  }

  throw new HttpError(403, "Clinic admins do not have clinical data access");
}

export async function assertDoctorOwnsVisit(doctorProfileId: string, visitId: string) {
  const visit = await prisma.visit.findUnique({ where: { id: visitId } });
  if (!visit) throw new HttpError(404, "Visit not found");
  if (visit.doctorId !== doctorProfileId) {
    throw new HttpError(403, "You may only modify visits you created");
  }
  return visit;
}
