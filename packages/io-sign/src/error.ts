export class EntityNotFoundError extends Error {
  name = "EntityNotFoundError";
}

export class ActionNotAllowedError extends Error {
  name = "ActionNotAllowedError";
}

export class ConflictError extends Error {
  name = "ConflictError";
}

export class TooManyRequestsError extends Error {
  name = "TooManyRequestsError";
}
