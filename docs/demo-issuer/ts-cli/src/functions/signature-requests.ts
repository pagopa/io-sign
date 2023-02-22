import inquirer from 'inquirer';
import { getSignatureRequest, getDocumentUploadUrl, sendNotification, setSignatureRequestStatus, createSignatureRequest } from './../apis/signature-requests.js';

export const callSignatureRequests = async () => {
    const answerSignatureRequests = await inquirer.prompt([
    {
      type: 'list',
      name: 'command',
      message: 'Cosa vuoi fare?',
      choices: ['getSignatureRequest', 'getDocumentUploadUrl','createSignatureRequest','setSignatureRequestStatus','sendNotification',],
	  },    
	]);
switch (answerSignatureRequests.command) {
	case 'getSignatureRequest':
	await callGetSignatureRequest();
	break;
	case 'getDocumentUploadUrl':
await callGetDocumentUploadUrl();
	break;
	case 'sendNotification':
	await callSendNotification();
	break;
	case 'setSignatureRequestStatus':
	await callSetSignatureRequestStatus();
	break;
	case 'createSignatureRequest':
	await callCreateSignatureRequest();
	break;
}
};

  const callGetSignatureRequest = async () => {
    const answerGetSignatureRequest = await inquirer.prompt([
    {
      type: 'input',
      name: 'id',
      message: 'Inserisci l\'ID della signature request:',
    validate: function (value: string) {
      if (!value) {
        return "Il valore non può essere nullo.";
      }
      return true;
    },
    },    
	]);
	  await getSignatureRequest(answerGetSignatureRequest.id);
  } ;
  
  const callGetDocumentUploadUrl = async () => {
    const answerGetDocumentUploadUrl = await inquirer.prompt([
    {
      type: 'input',
      name: 'req_id',
      message: 'Inserisci l\'id della richiesta:',
    validate: function (value: string) {
      if (!value) {
        return "Il valore non può essere nullo.";
      }
      return true;
    },
    },    
    {
      type: 'input',
      name: 'doc_id',
      message: 'Inserisci l\'id del documento:',
    validate: function (value: string) {
      if (!value) {
        return "Il valore non può essere nullo.";
      }
      return true;
    },
    },    
	]);
	   await getDocumentUploadUrl(answerGetDocumentUploadUrl.req_id, answerGetDocumentUploadUrl.doc_id);
};
  
  const callSendNotification = async () => {
    const answerSendNotification = await inquirer.prompt([
    {
      type: 'input',
      name: 'req_id',
      message: 'Inserisci l\'id della richiesta:',
    validate: function (value: string) {
      if (!value) {
        return "Il valore non può essere nullo.";
      }
      return true;
    },
    },    
	]);
	   await sendNotification(answerSendNotification.req_id);
};

  const callSetSignatureRequestStatus = async () => {
    const answerSetSignatureRequestStatus = await inquirer.prompt([
    {
      type: 'input',
      name: 'req_id',
      message: 'Inserisci l\'id della richiesta:',
    validate: function (value: string) {
      if (!value) {
        return "Il valore non può essere nullo.";
      }
      return true;
    },
    },    
    {
      type: 'confirm',
      name: 'isReady',
      message: 'Sei sicuro di voler inviare la richiesta?',
    },    
	]);
    if (answerSetSignatureRequestStatus.isReady) {
		await setSignatureRequestStatus(answerSetSignatureRequestStatus.req_id);
	}
};

  const callCreateSignatureRequest = async () => {
    const answerCreateSignatureRequest = await inquirer.prompt([
    {
      type: 'input',
      name: 'dossier_id',
      message: 'Inserisci l\'ID del dossier:',
    validate: function (value: string) {
      if (!value) {
        return "Il valore non può essere nullo.";
      }
      return true;
    },
    },    
    {
      type: 'input',
      name: 'signer_id',
      message: 'Inserisci il signer id recuperato in precedenza:',
    validate: function (value: string) {
      if (!value) {
        return "Il valore non può essere nullo.";
      }
      return true;
    },
    },    
    {
      type: 'input',
      name: 'expire_at',
      message: 'Entro quando deve firmare il cittadino?',
    },    
    {
      type: 'confirm',
      name: 'isReady',
      message: 'Sei sicuro di voler inviare la richiesta?',
    },    
	]);
    if (answerCreateSignatureRequest.isReady) {
		await createSignatureRequest(answerCreateSignatureRequest.dossier_id, answerCreateSignatureRequest.signer_id, answerCreateSignatureRequest.expires_at);
	}
};

