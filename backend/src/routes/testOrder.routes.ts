import { Router } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { validateBody } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { assertCanAccessPatient, assertDoctorOwnsVisit, getDoctorProfileOrThrow } from "../services/access";
import { HttpError } from "../middleware/errorHandler";
import { recordAudit } from "../utils/audit";

export const visitTestOrderRouter = Router();
visitTestOrderRouter.use(requireAuth);

const createOrderSchema = z.object({ testType: z.string().min(1) });

// Mounted at /visits/:visitId/test-orders
visitTestOrderRouter.post(
  "/:visitId/test-orders",
  requireRole("DOCTOR"),
  validateBody(createOrderSchema),
  asyncHandler(async (req, res) => {
    const doctor = await getDoctorProfileOrThrow(req.auth!.userId);
    const visit = await assertDoctorOwnsVisit(doctor.id, req.params.visitId);

    const body = req.body as z.infer<typeof createOrderSchema>;
    const testOrder = await prisma.testOrder.create({
      data: { visitId: visit.id, orderedById: doctor.id, testType: body.testType },
    });

    await recordAudit(req, { action: "TEST_ORDER_CREATE", targetType: "TestOrder", targetId: testOrder.id });
    res.status(201).json({ testOrder });
  }),
);

export const testResultRouter = Router();
testResultRouter.use(requireAuth);

const createResultSchema = z.object({
  resultSummary: z.string().optional(),
  resultData: z.record(z.unknown()).optional(),
});

// Mounted at /test-orders/:orderId/results
testResultRouter.post(
  "/:orderId/results",
  requireRole("DOCTOR"),
  validateBody(createResultSchema),
  asyncHandler(async (req, res) => {
    const doctor = await getDoctorProfileOrThrow(req.auth!.userId);
    const order = await prisma.testOrder.findUnique({ where: { id: req.params.orderId }, include: { visit: true } });
    if (!order) throw new HttpError(404, "Test order not found");
    await assertCanAccessPatient(req, order.visit.patientId);

    const body = req.body as z.infer<typeof createResultSchema>;
    const [result] = await prisma.$transaction([
      prisma.testResult.create({
        data: {
          testOrderId: order.id,
          resultSummary: body.resultSummary,
          resultDataJson: body.resultData as Prisma.InputJsonValue | undefined,
          reviewedById: doctor.id,
          reviewedAt: new Date(),
        },
      }),
      prisma.testOrder.update({ where: { id: order.id }, data: { status: "COMPLETED" } }),
    ]);

    await recordAudit(req, { action: "TEST_RESULT_CREATE", targetType: "TestResult", targetId: result.id });
    res.status(201).json({ result });
  }),
);

export const patientTestResultsRouter = Router();
patientTestResultsRouter.use(requireAuth);

// Mounted at /patients/:patientId/test-results
patientTestResultsRouter.get(
  "/:patientId/test-results",
  asyncHandler(async (req, res) => {
    await assertCanAccessPatient(req, req.params.patientId);
    const results = await prisma.testResult.findMany({
      where: { testOrder: { visit: { patientId: req.params.patientId } } },
      include: { testOrder: true, documents: { select: { id: true, mimeType: true, uploadedAt: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ results });
  }),
);
