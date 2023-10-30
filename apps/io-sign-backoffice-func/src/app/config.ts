import { pipe } from "fp-ts/function";
import * as RE from "fp-ts/lib/ReaderEither";
import { sequenceS } from "fp-ts/lib/Apply";
import {
  BackOfficeConfig,
  getBackOfficeConfigFromEnvironment,
} from "@/infra/back-office/config";
import {
  SlackConfig,
  getSlackConfigFromEnvironment,
} from "@/infra/slack/config";
import {
  SelfcareConfig,
  getSelfCareConfigFromEnvironment,
} from "@/infra/selfcare/config";

type Config = {
  backOffice: BackOfficeConfig;
  slack: SlackConfig;
  selfcare: SelfcareConfig;
};

export const getConfigFromEnvironment: RE.ReaderEither<
  NodeJS.ProcessEnv,
  Error,
  Config
> = pipe(
  sequenceS(RE.Apply)({
    backOffice: getBackOfficeConfigFromEnvironment,
    selfcare: getSelfCareConfigFromEnvironment,
    slack: getSlackConfigFromEnvironment,
  }),
  RE.map((config) => ({
    selfcare: config.selfcare,
    slack: config.slack,
    backOffice: config.backOffice,
  }))
);
