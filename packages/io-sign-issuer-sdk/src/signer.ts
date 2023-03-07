import inquirer from "inquirer";

import { createConfiguration } from "@io-sign/io-sign-api-client/configuration";
import { GetSignerByFiscalCodeBody } from "@io-sign/io-sign-api-client/models/GetSignerByFiscalCodeBody";
import { SignerApiRequestFactory } from "@io-sign/io-sign-api-client/apis/SignerApi";
import { createResponse } from "./utilities";
import { fiscalCodeQuestion } from "./questions";

export const callSigners = async (): Promise<
  ReturnType<typeof createResponse>
> => {
  const configuration = createConfiguration();
  const apiInstance = new SignerApiRequestFactory(configuration);

  const answerSigners = await inquirer.prompt([fiscalCodeQuestion]);
  const body: GetSignerByFiscalCodeBody = {
    fiscalCode: answerSigners.fiscalCode,
  };

  return apiInstance.getSignerByFiscalCode(body).then(createResponse);
};
