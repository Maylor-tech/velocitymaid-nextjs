export class DispatchError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = 'DispatchError';
    this.code = code;
    this.status = status;
  }
}

export function isDispatchError(err: unknown): err is DispatchError {
  return err instanceof DispatchError;
}
