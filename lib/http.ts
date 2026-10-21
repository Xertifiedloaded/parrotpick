import { NextRequest, NextResponse } from "next/server";
import { ZodError, type ZodTypeAny, type z } from "zod";
import { AppError } from "@/lib/errors";

type Handler = (req: NextRequest) => Promise<NextResponse>;

export function ok<T>(data: T, message?: string, status = 200) {
  return NextResponse.json({ success: true, message, data }, { status });
}

export function errorResponse(
  status: number,
  code: string,
  message: string,
  extra: { fields?: Record<string, string>; retryAfter?: number; data?: unknown } = {}
) {
  const res = NextResponse.json(
    {
      success: false,
      code,
      message,
      fields: extra.fields,
      retryAfter: extra.retryAfter,
      data: extra.data,
    },
    { status }
  );
  if (extra.retryAfter) res.headers.set("Retry-After", String(extra.retryAfter));
  return res;
}

/** Parses and validates a JSON body. Throws AppError / ZodError. */
export async function parseBody<S extends ZodTypeAny>(
  req: NextRequest,
  schema: S
): Promise<z.infer<S>> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    throw new AppError(400, "INVALID_JSON", "Request body must be valid JSON.");
  }
  return schema.parse(json);
}

function toErrorResponse(err: unknown): NextResponse {
  if (err instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of err.issues) {
      const key = issue.path.join(".") || "_";
      if (!fields[key]) fields[key] = issue.message;
    }
    const first = err.issues[0]?.message ?? "Invalid request.";
    return errorResponse(422, "VALIDATION_ERROR", first, { fields });
  }

  if (err instanceof AppError) {
    return errorResponse(err.status, err.code, err.message, {
      fields: err.fields,
      retryAfter: err.retryAfter,
    });
  }

  // Prisma unique constraint violation (race between check and insert)
  if (typeof err === "object" && err !== null && (err as { code?: string }).code === "P2002") {
    return errorResponse(409, "CONFLICT", "An account with these details already exists.");
  }

  console.error("[api] Unhandled error:", err);
  return errorResponse(500, "INTERNAL_ERROR", "Something went wrong. Please try again.");
}

/** Wraps a controller so every thrown error becomes a consistent JSON response. */
export function handle(fn: Handler): Handler {
  return async (req) => {
    try {
      return await fn(req);
    } catch (err) {
      return toErrorResponse(err);
    }
  };
}
