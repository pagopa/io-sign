import type { InvocationContext } from "@azure/functions";
import type {
  DomainEvent,
  Logger,
  LogProperties,
  TrackedException
} from "@pagopa/hexagonal-core/domain/ports";

const fmt = (base: LogProperties, extra?: LogProperties): string => {
  const merged = extra ? { ...base, ...extra } : base;
  return Object.keys(merged).length > 0 ? ` ${JSON.stringify(merged)}` : "";
};

const make = (context: InvocationContext, base: LogProperties): Logger => ({
  debug: (message, properties) =>
    context.debug(message + fmt(base, properties)),
  error: (message, properties) =>
    context.error(message + fmt(base, properties)),
  flush: () => Promise.resolve(),
  info: (message, properties) =>
    context.log(message + fmt(base, properties)),
  trackEvent: ({ name, properties }: DomainEvent) =>
    context.log(`[EVENT] ${name}${fmt(base, properties)}`),
  trackException: ({ error, properties }: TrackedException) =>
    context.error(
      `[EXCEPTION] ${error.message}${fmt(base, properties)}`,
      error
    ),
  warn: (message, properties) =>
    context.warn(message + fmt(base, properties)),
  with: (ctx) => make(context, { ...base, ...ctx })
});

export const makeInvocationContextLogger = (
  context: InvocationContext,
  baseProperties?: LogProperties
): Logger =>
  make(context, {
    invocationId: context.invocationId,
    functionName: context.functionName,
    ...baseProperties
  });
