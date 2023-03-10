import inquirer from "inquirer";

import { createConfiguration, SignerApi } from "@io-sign/io-sign-api-client";
import { GetSignerByFiscalCodeBody } from "@io-sign/io-sign-api-client/models/GetSignerByFiscalCodeBody";
import { fiscalCodeQuestion } from "./questions";

export const callSigners = async (
  SubscriptionKey = process.env.SUBSCRIPTION_KEY
) => {
  const configuration = createConfiguration({
    authMethods: {
      SubscriptionKey,
    },
  });

  const api = new SignerApi(configuration);

  const answerSigners = await inquirer.prompt([fiscalCodeQuestion]);
  const body: GetSignerByFiscalCodeBody = {
    fiscalCode: answerSigners.fiscalCode,
  };

  return api.getSignerByFiscalCode(body);
};
