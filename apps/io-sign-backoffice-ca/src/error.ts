export class SubscriptionCreationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SubscriptionCreationError";
  }
}

export class ParsingError extends Error {
  constructor(message: string, cause?: string) {
    super(message);
    this.cause = cause;
    this.name = "ParsingError";
  }
}
export class CosmosDatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CosmosDatabaseError";
  }
}
