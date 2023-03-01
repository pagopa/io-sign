const inquirer = require("inquirer");
import { Configuration, createConfiguration } from "../configuration";
import { GetSignerByFiscalCodeBody } from "../models/GetSignerByFiscalCodeBody";
import { SignerDetailView } from "../models/SignerDetailView";
import {
  RequestContext,
  HttpMethod,
  ResponseContext,
  HttpFile,
  IsomorphicFetchHttpLibraryPromise,
} from "../http/http";
import { SignerApiRequestFactory } from "../apis/SignerApi";
import { applySecurityAuthentication } from "./config";

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

  let instance = new IsomorphicFetchHttpLibraryPromise();

  apiInstance
    .getSignerByFiscalCode(body)
    .then((data: RequestContext) => {
	applySecurityAuthentication(data)
    .then((data: RequestContext) => {
      instance
        .send(data)
        .then((data: any) => {
		console.log(JSON.stringify(data));
        })
        .catch((error: any) => console.error(error));
    })
        .catch((error: any) => console.error(error));
    })
    .catch((error: any) => console.error(error));
};
