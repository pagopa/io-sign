import type { BaseError } from "@pagopa/hexagonal-core/domain/errors";
import type { UseCase } from "@pagopa/hexagonal-core/domain/ports";
import type { SignEvent } from "../../domain/sign-event.js";

export type SignEventUseCase = UseCase<SignEvent, void, BaseError>;
