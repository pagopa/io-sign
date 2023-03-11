import * as inquirer from "inquirer";

import {
  Configuration,
  SignerApi,
  GetSignerByFiscalCodeBody,
} from "@io-sign/io-sign-api-client";
import { fiscalCodeQuestion } from "./questions";

export const callSigners = async (configuration: Configuration) => {
  const api = new SignerApi(configuration);

  const answerSigners = await inquirer.prompt([fiscalCodeQuestion]);
  const getSignerByFiscalCodeBody: GetSignerByFiscalCodeBody = {
    fiscalCode: answerSigners.fiscalCode,
  };

  return api.getSignerByFiscalCode({ getSignerByFiscalCodeBody });
};
