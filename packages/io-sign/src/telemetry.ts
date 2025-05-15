import { IO } from "fp-ts/lib/IO";

export interface TelemetryService {
  trackEvent: (
    name: string,
    context: object,
    options: {
      sampling: boolean;
    }
  ) => IO<void>;
}

interface TelemetryEnvironment {
  telemetryService: TelemetryService;
}

export const sendTelemetryEvent =
  (name: string, context: object, options = { sampling: true }) =>
  (r: TelemetryEnvironment) =>
    r.telemetryService.trackEvent(name, context, options);
