
export class ApiError extends Error {
  status: number;
  code: string;
  fields?: Record<string, string>;
  data?: unknown;
  retryAfter?: number;

  constructor(
    status: number,
    code: string,
    message: string,
    extra: {
      fields?: Record<string, string>;
      data?: unknown;
      retryAfter?: number;
    } = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = extra.fields;
    this.data = extra.data;
    this.retryAfter = extra.retryAfter;
  }
}

type Method = "GET" | "POST" | "PATCH" | "DELETE";

type ApiOptions = {
  method?: Method;
  body?: unknown;
};

export async function api<T = unknown>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const { method = "GET", body } = options;
  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;

  let res: Response;

  try {
    res = await fetch(path, {
      method,
      credentials: "same-origin",
      headers:
        body !== undefined && !isFormData
          ? { "Content-Type": "application/json" }
          : undefined,
      body:
        body === undefined
          ? undefined
          : isFormData
            ? (body as FormData)
            : JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      "Network error. Check your connection and try again.",
    );
  }

  let json: Record<string, any> | null = null;

  try {
    json = await res.json();
  } catch {
    // Handle responses without a JSON body.
  }

  if (!res.ok) {
    const err = json?.error ?? json ?? {};

    throw new ApiError(
      res.status,
      err.code ?? json?.code ?? "UNKNOWN_ERROR",
      err.message ??
        json?.message ??
        "Something went wrong. Please try again.",
      {
        fields: err.fields ?? json?.fields,
        data: err.data ?? json?.data,
        retryAfter: err.retryAfter ?? json?.retryAfter,
      },
    );
  }

  return (json?.data !== undefined ? json.data : json) as T;
}

export function errorMessage(
  err: unknown,
  fallback = "Something went wrong. Try again.",
) {
  return err instanceof Error && err.message ? err.message : fallback;
}
