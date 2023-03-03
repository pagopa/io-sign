const inquirer = require("inquirer");
import { Configuration, createConfiguration } from "./../generated/configuration";
import { GetSignerByFiscalCodeBody } from "./../generated/models/GetSignerByFiscalCodeBody";
import { SignerApiRequestFactory } from "./../generated/apis/SignerApi";
import { createResponse, EndpointResponse } from "./utilities";
import { RequestContext } from "./../generated/http/http";

export const callSigners = async () => {
  const configuration = createConfiguration();
  const apiInstance = new SignerApiRequestFactory(configuration);

  const answerSigners = await inquirer.prompt([
    {
      type: "input",
      name: "fiscalCode",
      message: "Inserisci il codice fiscale:",
      validate: function (value: string) {
        if (!value) {
          return "Il valore non può essere nullo.";
        }
        return true;
      },
    },
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
