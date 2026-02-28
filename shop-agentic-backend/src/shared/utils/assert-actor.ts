import { AppError } from "@/shared/exceptions/AppError";
import type { DecodedIdToken } from "firebase-admin/auth";

export function assertActor(
  actor: DecodedIdToken | undefined,
): asserts actor is DecodedIdToken {
  if (!actor?.uid) throw AppError.unauthorized();
}
