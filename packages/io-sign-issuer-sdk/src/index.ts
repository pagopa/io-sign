import inquirer from "inquirer";

import { callSigners } from "./signer";
import { callDossiers } from "./dossier";
import { callSignatureRequests } from "./signature-request";

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
      await mainMenu();
      break;
    case "dossiers":
      await callDossiers();
      await mainMenu();
      break;
    case "signature-requests":
      await callSignatureRequests();
      await mainMenu();
      break;
    default:
      process.exit(0);
  }
};

await mainMenu();
