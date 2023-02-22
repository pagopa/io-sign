import inquirer from "inquirer";
//import createPrompt from './inquirer_config.js';
import { postSigner } from "./../apis/signers.js";

export const callSigners = async () => {
//  const answerSigners = await createPrompt([
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

  await postSigner(answerSigners.fiscalCode);
};
