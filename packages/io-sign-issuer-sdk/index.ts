import inquirer from "inquirer";

import { callSigners } from "./src/signerCli";
import { callDossiers } from "./src/dossierCli";
import { callSignatureRequests } from "./src/signatureRequestCli";

console.log(
  "Benvenuto nella CLI utilizzata dagli enti per integrarsi con Firma con IO"
);
const mainMenu = async () => {
  const answers = await inquirer.prompt([
    {
      type: "list",
      name: "command",
      message: "Quale endpoint vuoi eseguire?",
      choices: ["signers", "dossiers", "signature-requests", "nessuno"],
    },
  ]);

  switch (answers.command) {
    case "signers":
      await callSigners();
      mainMenu();
      break;
    case "dossiers":
      await callDossiers();
      mainMenu();
      break;
    case "signature-requests":
      await callSignatureRequests();
      mainMenu();
      break;
    default:
      process.exit(0);
  }
};

mainMenu();
