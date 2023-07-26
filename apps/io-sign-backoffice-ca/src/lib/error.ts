export class HttpError extends Error {
  constructor(message: string) {
    super(message);
  }
  error = this.message;
  status = 500;
}

class HttpBadRequestError extends HttpError {
  error = this.message;
  status = 400;
}

class HttpConflictError extends HttpError {
  error = this.message;
  status = 409;
}

export const getHttpError: (e: Error) => HttpError = (e) => {
  switch (e.name) {
    case "ZodError":
      return new HttpBadRequestError("error parsing the request body");
    case "ApiKeyAlreadyExistsError":
      return new HttpConflictError(e.message);
    default:
      return new HttpError(e.message);
  }
};
