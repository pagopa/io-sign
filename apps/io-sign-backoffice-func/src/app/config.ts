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

type Config = {
  backOffice: BackOfficeConfig;
  slack: SlackConfig;
  selfcare: SelfcareConfig;
};

export const getConfigFromEnvironment: () => Config = () => ({
  backOffice: getBackOfficeConfigFromEnvironment(),
  slack: getSlackConfigFromEnvironment(),
  selfcare: getSelfcareConfigFromEnvironment(),
});
