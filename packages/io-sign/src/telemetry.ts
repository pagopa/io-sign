import { IO } from "fp-ts/lib/IO";

export type TelemetryService = {
  trackEvent: (name: string, context: object) => IO<void>;
};

type TelemetryEnvironment = {
  telemetryService: TelemetryService;
};

export const sendTelemetryEvent =
  (name: string, context: object) => (r: TelemetryEnvironment) =>
    r.telemetryService.trackEvent(name, context);
