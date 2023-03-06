const inquirer = require("inquirer");
import { Configuration, createConfiguration } from "./../generated/configuration";
import { createResponse, EndpointResponse } from "./utilities";
import { RequestContext } from "./../generated/http/http";
import { GetSignerByFiscalCodeBody } from "./../generated/models/GetSignerByFiscalCodeBody";
import { SignerApiRequestFactory } from "./../generated/apis/SignerApi";
import { fiscalCodeQuestion } from "./questionsCli";
export const callSigners = async () => {
  const configuration = createConfiguration();
  const apiInstance = new SignerApiRequestFactory(configuration);

  const answerSigners = await inquirer.prompt([
fiscalCodeQuestion,
  ]);
  let body: GetSignerByFiscalCodeBody = {
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
