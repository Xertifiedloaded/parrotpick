export class AppError extends Error {
  status: number;
  code: string;
  fields?: Record<string, string>;
  retryAfter?: number;

  constructor(
    status: number,
    code: string,
    message: string,
    opts: { fields?: Record<string, string>; retryAfter?: number } = {}
  ) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.fields = opts.fields;
    this.retryAfter = opts.retryAfter;
  }
}
