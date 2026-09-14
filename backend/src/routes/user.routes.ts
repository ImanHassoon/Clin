import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { recordAudit } from "../utils/audit";

export const userRouter = Router();
userRouter.use(requireAuth);

const updateMeSchema = z.object({
  phone: z.string().optional(),
  patientProfile: z
    .object({
      bloodType: z.string().optional(),
      allergies: z.string().optional(),
      emergencyContact: z.string().optional(),
    })
    .optional(),
  doctorProfile: z
    .object({
      bio: z.string().optional(),
    })
    .optional(),
});

userRouter.patch(
  "/me",
  validateBody(updateMeSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof updateMeSchema>;

    const user = await prisma.user.update({
      where: { id: req.auth!.userId },
      data: {
        phone: body.phone,
        patientProfile: body.patientProfile ? { update: body.patientProfile } : undefined,
        doctorProfile: body.doctorProfile ? { update: body.doctorProfile } : undefined,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        patientProfile: true,
        doctorProfile: true,
      },
    });

    await recordAudit(req, { action: "USER_UPDATE_SELF", targetType: "User", targetId: user.id });
    res.json({ user });
  }),
);
