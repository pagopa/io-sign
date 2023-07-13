export class HttpError extends Error {
  constructor(message: string) {
    super(message);
  }
  error = this.message;
  status = 500;
}

export class HttpBadRequestError extends HttpError {
  error = this.message;
  status = 400;
}
export class HttpConflictError extends HttpError {
  error = this.message;
  status = 409;
}
