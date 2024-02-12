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
  getSelfcareConfigFromEnvironment,
} from "@/infra/selfcare/config";
import {
  GoogleConfig,
  getGoogleConfigFromEnvironment,
} from "@/infra/google/config";

type Config = {
  backOffice: BackOfficeConfig;
  slack: SlackConfig;
  selfcare: SelfcareConfig;
  google: GoogleConfig;
};

export const getConfigFromEnvironment = (): Config => ({
  backOffice: getBackOfficeConfigFromEnvironment(),
  slack: getSlackConfigFromEnvironment(),
  selfcare: getSelfcareConfigFromEnvironment(),
  google: getGoogleConfigFromEnvironment(),
});
