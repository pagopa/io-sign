import inquirer from "inquirer";

import { createConfiguration } from "@io-sign/io-sign-api-client/configuration";
import { RequestContext } from "@io-sign/io-sign-api-client/http/http";
import { GetSignerByFiscalCodeBody } from "@io-sign/io-sign-api-client/models/GetSignerByFiscalCodeBody";
import { SignerApiRequestFactory } from "@io-sign/io-sign-api-client/apis/SignerApi";
import { createResponse, EndpointResponse } from "./utilities";
import { fiscalCodeQuestion } from "./questions";

export const callSigners = async () => {
  const configuration = createConfiguration();
  const apiInstance = new SignerApiRequestFactory(configuration);

  const answerSigners = await inquirer.prompt([fiscalCodeQuestion]);
  const body: GetSignerByFiscalCodeBody = {
    fiscalCode: answerSigners.fiscalCode,
  };

  apiInstance
    .getSignerByFiscalCode(body)
    .then((data: RequestContext) => {
      createResponse(data)
        .then((data: EndpointResponse) => {
          console.log(data);
        })
        .catch((error: any) => console.error(error));
    })
    .catch((error: any) => console.error(error));
};
