import { NextFunction, Request, Response } from "express";
import { Role } from "@prisma/client";
import { HttpError } from "./errorHandler";

/** Coarse-grained role gate. Fine-grained "does this doctor own this patient"
 * checks live in services/access.ts and run inside the route handler. */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      throw new HttpError(403, "You do not have permission to perform this action");
    }
    next();
  };
}
