import * as fs from "fs";
import * as YAML from "yaml";
import * as dotenv from "dotenv";
import * as fetch from "isomorphic-fetch";
import { Configuration } from "@io-sign/io-sign-api-client";
import { callSigners } from "./signer";
import { callDossier, callGetRequestsByDossier } from "./dossier";
import { callSignatureRequests } from "./signature-request";
import { APIMiddleware } from "./middleware";
import { SdkSchema, SdkSchemaWithSignatureRequest } from "./schema";

dotenv.config();

const apiPath = process.env.API_PATH;
const subscriptionKey = process.env.SUBSCRIPTION_KEY;

if (subscriptionKey === undefined || subscriptionKey === null) {
  throw new Error("Missing Subscription Key");
}

if (apiPath === undefined || apiPath === null) {
  throw new Error("Missing api path");
}
const checkSigner = async (
  configuration: Configuration,
  data: SdkSchema
): Promise<SdkSchema> => {
  if (data.fiscalCode) {
    return callSigners(configuration, data.fiscalCode).then((result) => {
      console.log("risultato signer: " + JSON.stringify(result, null, 2));
      if (data.signatureRequest) {
        // eslint-disable-next-line functional/immutable-data
        data.signatureRequest.signerId = result.id;
      }
      return data;
    });
  } else {
    return data;
  }
};

const checkDossier = async (
  configuration: Configuration,
  data: SdkSchema
): Promise<SdkSchema> => {
	if (data.signatureRequests) {
    return callGetRequestsByDossier(configuration, data.signatureRequests).then((result: any) => {
      console.log("risultato dossier: " + JSON.stringify(result, null, 2));
	return data;
	});
	}
  if (data.dossier) {
    return callDossier(configuration, data.dossier).then((result) => {
      console.log("risultato dossier: " + JSON.stringify(result, null, 2));
      if (data.signatureRequest) {
        // eslint-disable-next-line functional/immutable-data
        data.signatureRequest.dossierId = result.id;
      }
      return data;
    });
  } else {
    return data;
  }
};

const checkSignatureRequest = async (
  configuration: Configuration,
  data: SdkSchema
) => {
  if (data.signatureRequest != null) {
    return callSignatureRequests(
      configuration,
      data as SdkSchemaWithSignatureRequest
    ).then((result) =>
      console.log(
        "risultato signature request: " + JSON.stringify(result, null, 2)
      )
    );
  }
};

function main() {
  const configuration = new Configuration({
    basePath: apiPath,
    apiKey: subscriptionKey,
    fetchApi: fetch,
    middleware: [new APIMiddleware()],
  });

  const file = fs.readFileSync("./file.yaml", "utf8");
  const data = YAML.parse(file);

  // TODO: insert runtime check on data type

  checkSigner(configuration, data)
    .then((signerChecked) => checkDossier(configuration, signerChecked))
    .then((dossierChecked) =>
      checkSignatureRequest(configuration, dossierChecked)
    )
    .catch((err) => {
      console.error("errore: ", err);
    });
}

main();
