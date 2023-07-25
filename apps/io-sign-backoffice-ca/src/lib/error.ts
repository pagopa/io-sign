export class ParsingInputError extends Error {
  constructor(cause = {}) {
    super("error parsing the request body");
    this.name = "ParsingError";
    this.cause = cause;
  }
}

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
    case "ParsingInputError":
      return new HttpBadRequestError(e.message);
    case "ApiKeyAlreadyExistsError":
      return new HttpConflictError(e.message);
    default:
      return new HttpError(e.message);
  }
};
