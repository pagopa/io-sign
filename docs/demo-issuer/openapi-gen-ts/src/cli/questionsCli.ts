import { isNotNull, isNotNumber } from "./utilities";

export const fiscalCodeQuestion =     {
      type: "input",
      name: "fiscalCode",
      message: "Inserisci il codice fiscale:",
      validate: function(value: string) { return isNotNull(value); },
    };
	
export const signatureRequestFirstQuestion =     {
      type: 'list',
      name: 'command',
      message: 'Cosa vuoi fare?',
      choices: ['getSignatureRequest', 'getDocumentUploadUrl','createSignatureRequest','setSignatureRequestStatus','sendNotification',],
	  };
	  
	  export const signatureRequestIdQuestion =     {
      type: 'input',
      name: 'id',
      message: 'Inserisci l\'ID della signature request:',
      validate: function(value: string) { return isNotNull(value); },
    };
	
	export const dossierIdQuestion =     {
      type: 'input',
      name: 'doc_id',
      message: 'Inserisci l\'id del documento:',
      validate: function(value: string) { return isNotNull(value); },
    };

export const changeSignatureRequestStatusQuestion =     {
      type: 'confirm',
      name: 'isReady',
      message: 'Sei sicuro di voler inviare la richiesta?',
    };

export const signerIdQuestion =     {
      type: 'input',
      name: 'signer_id',
      message: 'Inserisci il signer id recuperato in precedenza:',
      validate: function(value: string) { return isNotNull(value); },
    };

export const expiresAtQuestion ={
      type: 'input',
      name: 'expire_at',
      message: 'Entro quando deve firmare il cittadino?',
    };
	
export const createSignatureRequestQuestion = {
      type: 'confirm',
      name: 'isReady',
      message: 'Sei sicuro di voler inviare la richiesta?',
    };

export const dossierTitleQuestion = {
      type: 'input',
      name: 'title',
      message: 'Inserisci il titolo del dossier:',
      validate: function(value: string) { return isNotNull(value); },
    };
	
    export const documentTitleQuestion = {
      type: 'input',
      name: 'document_title',
      message: 'Inserisci il titolo del documento:',
      validate: function(value: string) { return isNotNull(value); },
	};

export const numberOfDocumentsQuestion = {
      type: 'input',
      name: 'number_of_documents',
      message: 'Quanti documenti vuoi aggiungere?',
      validate: function(value: string) { return isNotNumber(value); },
	default: 1,
	};

export const numberOfSignaturesQuestion =     {
      type: 'input',
      name: 'number_of_signatures',
      message: 'Quante firme contiene?',
      validate: function(value: string) { return isNotNumber(value); },
	default: 1,
	};

    export const clauseAttrsIdQuestion = {
      type: 'input',
      name: 'id',
      message: 'Inserisci l\'identificativo della firma:',
      validate: function(value: string) { return isNotNull(value); },
	};
	
    export const clauseTitleQuestion = {
      type: 'input',
      name: 'clause_title',
      message: 'Inserisci il titolo della clausola:',
      validate: function(value: string) { return isNotNull(value); },
	};
	
    export const clauseTypeQuestion = {
      type: 'list',
      name: 'clause_type',
      message: 'Seleziona la tipologia di clausola:',
	  choices: ['REQUIRED', 'OPTIONAL', 'UNFAIR'],
    };

export const dossierFirstQuestion =     {
      type: 'confirm',
      name: 'signatureAttrsType',
      message: 'Ne vuoi creare uno nuovo?',
	  };

export const clauseAttrsTypeQuestion =     {
      type: 'list',
      name: 'command',
      message: 'Che tipo di attributi ha la firma?',
      choices: ['id univoco', 'coordinate'],
	  };
	  
	  export const clauseAttrsXCoordsQuestion =     {
      type: 'input',
      name: 'x_coords',
      message: 'Inserisci la coordinata X:',
      validate: function(value: string) { return isNotNumber(value); },
    };
	  export const clauseAttrsYCoordsQuestion = {
      type: 'input',
      name: 'y_coords',
      message: 'Inserisci la coordinata Y:',
      validate: function(value: string) { return isNotNumber(value); },
    };
	  export const clauseAttrsWidthCoordsQuestion =     {
      type: 'input',
      name: 'width_coords',
      message: 'Inserisci la larghezza:',
      validate: function(value: string) { return isNotNumber(value); },
    };
	
	  export const clauseAttrsHeightCoordsQuestion =     {
      type: 'input',
      name: 'height_coords',
      message: 'Inserisci l\'altezza:',
      validate: function(value: string) { return isNotNumber(value); },
    };
	
	  export const clauseAttrsPageCoordsQuestion =     {
      type: 'input',
      name: 'page_coords',
      message: 'Inserisci il numero di pagina (la prima pagina è 0):',
      validate: function(value: string) { return isNotNumber(value); },
    };
