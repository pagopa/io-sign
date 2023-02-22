import inquirer from 'inquirer';
import { callSigners } from './functions/signers.js';
import { callDossiers } from './functions/dossiers.js';
import { callSignatureRequests } from './functions/signature-requests.js';

console.log('Benvenuto nella CLI utilizzata dagli enti per integrarsi con Firma con IO');
const mainMenu = async () => {
/*
  useKeypress(async (key) => {
  if (key.name === "c" && key.ctrl) {
    process.exit();
  }
*/
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
