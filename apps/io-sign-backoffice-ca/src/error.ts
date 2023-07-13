export class SubscriptionCreationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SubscriptionCreationError";
  }
}

export class ParsingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParsingError";
  }
}
export class CosmosDatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CosmosDatabaseError";
  }
}
