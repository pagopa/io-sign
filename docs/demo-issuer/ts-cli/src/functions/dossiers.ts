import inquirer from 'inquirer';
import { getDossier, postDossier } from './../apis/dossiers.js';
import { Dossier, Document, Signature } from "./../models/request-models.js";
export const callDossiers = async () => {
    const answerDossiers = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'new',
      message: 'Ne vuoi creare uno nuovo?',
	  },    
	]);
if (answerDossiers.new){
await callNewDossier();
} else {
    const answerGetDossier = await inquirer.prompt([
    {
      type: 'input',
      name: 'id',
      message: 'Inserisci l\'ID del dossier:',
    validate: function (value: string) {
      if (!value) {
        return "Il valore non può essere nullo.";
      }
      return true;
    },
    },    
	]);
	  await getDossier(answerGetDossier.id);
}
  } ;

const callNewDossier = async () => {
    const answerPostDossier = await inquirer.prompt([
    {
      type: 'input',
      name: 'title',
      message: 'Inserisci il titolo del dossier:',
    validate: function (value: string) {
      if (!value) {
        return "Il valore non può essere nullo.";
      }
      return true;
    },
    },    
    {
      type: 'input',
      name: 'document_title',
      message: 'Inserisci il titolo del documento:',
    validate: function (value: string) {
      if (!value) {
        return "Il valore non può essere nullo.";
      }
      return true;
    },    
	},
    {
      type: 'input',
      name: 'number_of_documents',
      message: 'Quanti documenti vuoi aggiungere?',
    validate: function (value: string) {
      if (!Number.isInteger(Number(value))) {
        return "Il valore deve essere un numero intero.";
      }
      return true;
    },    
	default: 1,
	},
	]);
	let obj: Dossier = {
  "title": answerPostDossier.title,
  "documents_metadata": []
	};
	
	for (let i=0; i<answerPostDossier.number_of_documents; i++) {
		let document: Document = await newDocument();
		obj.documents_metadata.push(document);
	}
	
	  await postDossier(obj);
  } ;

const newDocument = async() => {
		    const answerNewDocument = await inquirer.prompt([
    {
      type: 'input',
      name: 'document_title',
      message: 'Inserisci il titolo del documento:',
    validate: function (value: string) {
      if (!value) {
        return "Il valore non può essere nullo.";
      }
      return true;
    },    
	},
    {
      type: 'input',
      name: 'number_of_signatures',
      message: 'Quante firme contiene?',
    validate: function (value: string) {
      if (!Number.isInteger(Number(value))) {
        return "Il valore deve essere un numero intero.";
      }
      return true;
    },    
	default: 1,
	},
	]);
let document: Document =    {
      "title": answerNewDocument.document_title,
      "signature_fields": []
};
		for (let i=0; i<answerNewDocument.number_of_signatures; i++) {
let signature: Signature = await newSignature();
document.signature_fields.push(signature);
	}
	return document;
};

const newSignature = async() => {
    const answerNewSignature = await inquirer.prompt([
    {
      type: 'input',
      name: 'id',
      message: 'l\'identificativo della firma:',
    validate: function (value: string) {
      if (!value) {
        return "Il valore non può essere nullo.";
      }
      return true;
    },    
	},
    {
      type: 'input',
      name: 'clause_title',
      message: 'Inserisci il titolo della clausola:',
    validate: function (value: string) {
      if (!value) {
        return "Il valore non può essere nullo.";
      }
      return true;
    },    
	},
    {
      type: 'list',
      name: 'clause_type',
      message: 'Seleziona la tipologia di clausola:',
	  choices: ['REQUIRED', 'OPTIONAL', 'UNFAIR'],
    },    
	]);
let signature :Signature = {
          "attrs": {"unique_name": answerNewSignature.id},
          "clause": {
            "title": answerNewSignature.clause_title,
            "type": answerNewSignature.clause_type
		  }
};
return signature;
};
