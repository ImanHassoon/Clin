import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { hashPassword, verifyPassword } from "../utils/password";
import { generateRefreshToken, hashRefreshToken, signAccessToken } from "../utils/jwt";
import { validateBody } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { HttpError } from "../middleware/errorHandler";
import { recordAudit } from "../utils/audit";

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(["PATIENT", "DOCTOR"]),
  patientProfile: z
    .object({
      dateOfBirth: z.string().datetime().optional(),
      sex: z.string().optional(),
      bloodType: z.string().optional(),
      allergies: z.string().optional(),
      emergencyContact: z.string().optional(),
    })
    .optional(),
  doctorProfile: z
    .object({
      specialty: z.string(),
      licenseNumber: z.string(),
      bio: z.string().optional(),
      clinicId: z.string().uuid().optional(),
    })
    .optional(),
});

// NOTE: real deployments should not let doctors self-register with no
// verification step (license lookup, clinic-admin invite, etc). Wide open
// here because this is a scaffold with no admin-invite flow built yet.
authRouter.post(
  "/register",
  validateBody(registerSchema),
  asyncHandler(async (req, res) => {
    const body = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) throw new HttpError(409, "An account with this email already exists");

    if (body.role === "DOCTOR" && !body.doctorProfile) {
      throw new HttpError(400, "doctorProfile is required when role is DOCTOR");
    }

    const passwordHash = await hashPassword(body.password);

    const user = await prisma.user.create({
      data: {
        email: body.email,
        phone: body.phone,
        firstName: body.firstName,
        lastName: body.lastName,
        passwordHash,
        role: body.role,
        ...(body.role === "PATIENT"
          ? {
              patientProfile: {
                create: {
                  dateOfBirth: body.patientProfile?.dateOfBirth
                    ? new Date(body.patientProfile.dateOfBirth)
                    : undefined,
                  sex: body.patientProfile?.sex,
                  bloodType: body.patientProfile?.bloodType,
                  allergies: body.patientProfile?.allergies,
                  emergencyContact: body.patientProfile?.emergencyContact,
                },
              },
            }
          : {
              doctorProfile: {
                create: {
                  specialty: body.doctorProfile!.specialty,
                  licenseNumber: body.doctorProfile!.licenseNumber,
                  bio: body.doctorProfile?.bio,
                  clinicId: body.doctorProfile?.clinicId,
                },
              },
            }),
      },
      select: { id: true, email: true, role: true },
    });

    await recordAudit(req, { action: "USER_REGISTER", targetType: "User", targetId: user.id });

    res.status(201).json({ user });
  }),
);

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

authRouter.post(
  "/login",
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as z.infer<typeof loginSchema>;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        patientProfile: { select: { id: true } },
        doctorProfile: { select: { id: true } },
      },
    });
    if (!user || !user.isActive) throw new HttpError(401, "Invalid credentials");

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) throw new HttpError(401, "Invalid credentials");

    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    const { token: refreshToken, hash, expiresAt } = generateRefreshToken();

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hash,
        expiresAt,
        deviceInfo: req.headers["user-agent"] ?? undefined,
      },
    });

    req.auth = { userId: user.id, role: user.role };
    await recordAudit(req, { action: "USER_LOGIN", targetType: "User", targetId: user.id });

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        patientProfile: user.patientProfile,
        doctorProfile: user.doctorProfile,
      },
    });
  }),
);

const refreshSchema = z.object({ refreshToken: z.string() });

authRouter.post(
  "/refresh",
  validateBody(refreshSchema),
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body as z.infer<typeof refreshSchema>;
    const tokenHash = hashRefreshToken(refreshToken);

    const existing = await prisma.refreshToken.findFirst({ where: { tokenHash } });
    if (!existing || existing.revokedAt || existing.expiresAt < new Date()) {
      throw new HttpError(401, "Refresh token is invalid or expired");
    }

    const user = await prisma.user.findUnique({ where: { id: existing.userId } });
    if (!user || !user.isActive) throw new HttpError(401, "Invalid credentials");

    // Rotate: revoke the used token and issue a brand new one.
    const rotated = generateRefreshToken();
    await prisma.$transaction([
      prisma.refreshToken.update({ where: { id: existing.id }, data: { revokedAt: new Date() } }),
      prisma.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash: rotated.hash,
          expiresAt: rotated.expiresAt,
          deviceInfo: existing.deviceInfo,
        },
      }),
    ]);

    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    res.json({ accessToken, refreshToken: rotated.token });
  }),
);

const logoutSchema = z.object({ refreshToken: z.string() });

authRouter.post(
  "/logout",
  validateBody(logoutSchema),
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body as z.infer<typeof logoutSchema>;
    const tokenHash = hashRefreshToken(refreshToken);
    await prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    res.status(204).send();
  }),
);

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.auth!.userId },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        mfaEnabled: true,
        createdAt: true,
        patientProfile: true,
        doctorProfile: true,
      },
    });
    if (!user) throw new HttpError(404, "User not found");
    res.json({ user });
  }),
);
