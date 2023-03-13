import * as inquirer from "inquirer";
import { Configuration } from "@io-sign/io-sign-api-client";
import * as fetch from "isomorphic-fetch";
import { callSigners } from "./signer";
import { callDossiers } from "./dossier";
import { callSignatureRequests } from "./signature-request";

const apiPath = process.env.API_PATH;
const subscriptionKey = process.env.SUBSCRIPTION_KEY;

if (subscriptionKey === undefined || subscriptionKey === null) {
  throw new Error("Missing Subscription Key");
}

if (apiPath === undefined || apiPath === null) {
  throw new Error("Missing api path");
}

console.log(
  "Benvenuto nella CLI utilizzata dagli enti per integrarsi con Firma con IO"
);

const mainMenu = async (
  SubscriptionKey: string = subscriptionKey,
  ApiPath: string = apiPath
) => {
  const answers = await inquirer.prompt([
    {
      type: "list",
      name: "command",
      message: "Quale endpoint vuoi eseguire?",
      choices: ["signers", "dossiers", "signature-requests", "nessuno"],
    },
  ]);

  const configuration = new Configuration({
    basePath: ApiPath,
    apiKey: SubscriptionKey,
    fetchApi: fetch,
  });

  switch (answers.command) {
    case "signers":
      await callSigners(configuration);
      await mainMenu();
      break;
    case "dossiers":
      await callDossiers(configuration);
      await mainMenu();
      break;
    case "signature-requests":
      await callSignatureRequests(configuration);
      await mainMenu();
      break;
    default:
      process.exit(0);
  }
};

mainMenu().catch(console.error);
