import inquirer from "inquirer";

import { Configuration, SignerApi } from "@io-sign/io-sign-api-client";
import { GetSignerByFiscalCodeBody } from "@io-sign/io-sign-api-client/models/GetSignerByFiscalCodeBody";
import { fiscalCodeQuestion } from "./questions";

export const callSigners = async (configuration: Configuration) => {
  const api = new SignerApi(configuration);

  const answerSigners = await inquirer.prompt([fiscalCodeQuestion]);
  const body: GetSignerByFiscalCodeBody = {
    fiscalCode: answerSigners.fiscalCode,
  };

  return api.getSignerByFiscalCode(body);
};
