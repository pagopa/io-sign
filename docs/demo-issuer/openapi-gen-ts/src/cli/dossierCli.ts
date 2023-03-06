const inquirer = require("inquirer");
import { Configuration, createConfiguration } from "./../generated/configuration";
import { createResponse, EndpointResponse } from "./utilities";
import { RequestContext } from "./../generated/http/http";
import { CreateDossierBody } from '../generated/models/CreateDossierBody';
import { DocumentMetadata } from '../generated/models/DocumentMetadata';
import { SignatureField } from '../generated/models/SignatureField';
import { Clause } from '../generated/models/Clause';
import { SignatureFieldAttrs } from '../generated/models/SignatureFieldAttrs';
import { DossierApiRequestFactory } from "./../generated/apis/DossierApi";
import { 
dossierIdQuestion, 
dossierTitleQuestion, 
dossierFirstQuestion, 
documentTitleQuestion, 
clauseAttrsIdQuestion, 
clauseTitleQuestion, 
clauseTypeQuestion, 
numberOfDocumentsQuestion, 
numberOfSignaturesQuestion,
clauseAttrsTypeQuestion, 	clauseAttrsXCoordsQuestion,
	clauseAttrsYCoordsQuestion,
	clauseAttrsHeightCoordsQuestion,
	clauseAttrsWidthCoordsQuestion,
	clauseAttrsPageCoordsQuestion,

} from "./questionsCli";
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
await callGetDossier();
}
  } ;

const callNewDossier = async () => {
	  const configuration = createConfiguration();
  const apiInstance = new DossierApiRequestFactory(configuration);

    const answerPostDossier = await inquirer.prompt([
	dossierTitleQuestion,
	numberOfDocumentsQuestion
	]);
	let body: CreateDossierBody = {
  "title": answerPostDossier.title,
  "documentsMetadata": []
	};
	
	for (let i=1; i<=answerPostDossier.number_of_documents; i++) {
		console.log("Document "+i+" of "+answerPostDossier.number_of_documents);
		let document: DocumentMetadata = await newDocument();
		body.documentsMetadata.push(document);
	}
	
  apiInstance
    .createDossier(body)
    .then((data: RequestContext) => {
	createResponse(data)
    .then((data: EndpointResponse) => {
		console.log(data);
        })
        .catch((error: any) => console.error(error));
        })
        .catch((error: any) => console.error(error));
  } ;

const newDocument = async() => {
		    const answerNewDocument = await inquirer.prompt([
			documentTitleQuestion,
			numberOfSignaturesQuestion
	]);
let document: DocumentMetadata =    {
      "title": answerNewDocument.document_title,
      "signatureFields": []
};
		for (let i=0; i<answerNewDocument.number_of_signatures; i++) {
let signature: SignatureField = await newSignature();
document.signatureFields.push(signature);
	}
	return document;
};

const newSignature = async() => {
    const answerNewSignature = await inquirer.prompt([
	clauseTitleQuestion,
	clauseTypeQuestion,
	clauseAttrsTypeQuestion
	]);
	let attrs: SignatureFieldAttrs = {
		"uniqueName": "",
		"coordinates": {"x":0, "y":0},
		"page": 0,
		"size": {"w":0 , "h":0}
	};
	if(answerNewSignature.command == 'id univoco') {
		attrs = await addUniqueName();
	} else {
	attrs = await addCoords();
	}
let signature :SignatureField = {
          "attrs": attrs,
          "clause": {
            "title": answerNewSignature.clause_title,
            "type": answerNewSignature.clause_type
		  }
};
return signature;
};

const addCoords = async() => {
    const answerAddCoords = await inquirer.prompt([
	clauseAttrsXCoordsQuestion,
	clauseAttrsYCoordsQuestion,
	clauseAttrsHeightCoordsQuestion,
	clauseAttrsWidthCoordsQuestion,
	clauseAttrsPageCoordsQuestion,
	]);
	let attrs: SignatureFieldAttrs = {
		"uniqueName": "",
		"coordinates": {"x":answerAddCoords.x_coords, "y":answerAddCoords.y_coords},
		"page": answerAddCoords.page_corrds,
		"size": {"w":answerAddCoords.width_coords, "h":answerAddCoords.height_coords}
	};
return attrs;
};

const addUniqueName = async() => {
    const answerAddUniqueName = await inquirer.prompt([
	clauseAttrsIdQuestion,
	]);
	let attrs: SignatureFieldAttrs = {
		"uniqueName": answerAddUniqueName.id,
		"coordinates": {"x":0, "y":0},
		"page": 0,
		"size": {"w":0 , "h":0}
	};
return attrs;
};

const callGetDossier = async () => {
		  const configuration = createConfiguration();
  const apiInstance = new DossierApiRequestFactory(configuration);
    const answerGetDossier = await inquirer.prompt([
    {
		dossierIdQuestion
    },    
	]);
  apiInstance
    .getDossier(answerGetDossier.id)
    .then((data: RequestContext) => {
	createResponse(data)
    .then((data: EndpointResponse) => {
		console.log(data);
        })
        .catch((error: any) => console.error(error));
        })
        .catch((error: any) => console.error(error));

};

