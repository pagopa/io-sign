export class HttpError extends Error {
  error = "Internal Server Error";
  status = 500;
}

export class HttpBadRequestError extends HttpError {
  error = "Bad Request";
  status = 400;
}

export class HttpConflictError extends HttpError {
  error = "Conflict";
  status = 409;
}
