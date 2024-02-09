import { TelemetryClient } from "applicationinsights";
import { TelemetryService } from "../../../telemetry";

export class ApplicationInsights implements TelemetryService {
  #telemetryClient: TelemetryClient;

  constructor(telemetryClient: TelemetryClient) {
    this.#telemetryClient = telemetryClient;
  }

  trackEvent(name: string, context: object) {
    return () =>
      this.#telemetryClient.trackEvent({
        name,
        properties: context,
      });
  }
}
