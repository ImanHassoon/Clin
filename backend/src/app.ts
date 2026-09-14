import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";

import { authRouter } from "./routes/auth.routes";
import { userRouter } from "./routes/user.routes";
import { doctorRouter } from "./routes/doctor.routes";
import { patientRouter } from "./routes/patient.routes";
import { appointmentRouter } from "./routes/appointment.routes";
import { visitRouter, patientVisitsRouter } from "./routes/visit.routes";
import { caseRouter, patientCasesRouter } from "./routes/case.routes";
import { visitDiagnosisRouter, caseDiagnosisRouter } from "./routes/diagnosis.routes";
import { visitTestOrderRouter, testResultRouter, patientTestResultsRouter } from "./routes/testOrder.routes";
import { imagingRouter, patientImagingRouter } from "./routes/imaging.routes";
import { visitPrescriptionRouter, patientPrescriptionRouter } from "./routes/prescription.routes";
import { consentRouter } from "./routes/consent.routes";
import { auditRouter } from "./routes/audit.routes";
import { filesRouter } from "./routes/files.routes";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigins.length > 0 ? env.corsOrigins : false,
      credentials: true,
    }),
  );
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });

  const v1 = express.Router();
  v1.use("/auth", authLimiter, authRouter);
  v1.use("/users", userRouter);
  v1.use("/doctors", doctorRouter);
  v1.use("/patients", patientRouter);
  v1.use("/patients", patientVisitsRouter);
  v1.use("/patients", patientCasesRouter);
  v1.use("/patients", patientTestResultsRouter);
  v1.use("/patients", patientImagingRouter);
  v1.use("/patients", patientPrescriptionRouter);
  v1.use("/appointments", appointmentRouter);
  v1.use("/visits", visitRouter);
  v1.use("/visits", visitDiagnosisRouter);
  v1.use("/visits", visitTestOrderRouter);
  v1.use("/visits", visitPrescriptionRouter);
  v1.use("/cases", caseRouter);
  v1.use("/cases", caseDiagnosisRouter);
  v1.use("/test-orders", testResultRouter);
  v1.use("/imaging", imagingRouter);
  v1.use("/consents", consentRouter);
  v1.use("/audit-logs", auditRouter);
  v1.use("/files", filesRouter);

  app.use("/api/v1", v1);

  app.use(errorHandler);

  return app;
}
