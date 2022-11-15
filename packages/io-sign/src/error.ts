/* eslint-disable max-classes-per-file */
export class EntityNotFoundError extends Error {
  name = "EntityNotFoundError";
}

export class ActionNotAllowedError extends Error {
  name = "ActionNotAllowedError";
}
export class TooManyRequestsError extends Error {
  name = "TooManyRequestsError";
}
