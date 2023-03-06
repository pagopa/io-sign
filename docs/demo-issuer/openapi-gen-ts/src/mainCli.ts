const inquirer = require("inquirer");
import { callSigners } from './cli/signerCli';
import { callDossiers } from './cli/dossierCli';
import { callSignatureRequests } from './cli/signatureRequestCli';

console.log('Benvenuto nella CLI utilizzata dagli enti per integrarsi con Firma con IO');
const mainMenu = async () => {
  const answers = await inquirer.prompt([    {
      type: 'list',
      name: 'command',
      message: 'Quale endpoint vuoi eseguire?',
      choices: ['signers', 'dossiers', 'signature-requests', 'nessuno'],
    },
  ]);

  switch (answers.command) {
    case 'signers':
       await callSigners();
	  mainMenu();
      break;
    case 'dossiers':
       await callDossiers();
	  mainMenu();
      break;
    case 'signature-requests':
       await callSignatureRequests();
	  mainMenu();
      break;
    default:
      process.exit(0);
  }
}
  
mainMenu();
