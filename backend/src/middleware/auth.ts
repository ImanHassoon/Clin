import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { HttpError } from "./errorHandler";

/** Populates req.auth from a valid Bearer access token, or rejects with 401. */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new HttpError(401, "Missing or malformed Authorization header");
  }
  const token = header.slice("Bearer ".length);
  try {
    const payload = verifyAccessToken(token);
    req.auth = { userId: payload.sub, role: payload.role };
    next();
  } catch {
    throw new HttpError(401, "Invalid or expired access token");
  }
}
