import * as inquirer from "inquirer";
import {
  Configuration,
  DossierApi,
  DocumentMetadata,
  SignatureField,
  SignatureFieldAttrs,
  CreateDossierBody,
} from "@io-sign/io-sign-api-client";
import {
  dossierIdQuestion,
  dossierTitleQuestion,
  documentTitleQuestion,
  clauseAttrsIdQuestion,
  clauseTitleQuestion,
  clauseTypeQuestion,
  numberOfDocumentsQuestion,
  numberOfSignaturesQuestion,
  clauseAttrsTypeQuestion,
  clauseAttrsXCoordsQuestion,
  clauseAttrsYCoordsQuestion,
  clauseAttrsHeightCoordsQuestion,
  clauseAttrsWidthCoordsQuestion,
  clauseAttrsPageCoordsQuestion,
} from "./questions";

export const callDossiers = async (configuration: Configuration) => {
  const answerDossiers = await inquirer.prompt([
    {
      type: "confirm",
      name: "new",
      message: "Ne vuoi creare uno nuovo?",
    },
  ]);
  if (answerDossiers.new) {
    await callNewDossier(configuration);
  } else {
    await callGetDossier(configuration);
  }
};

const callNewDossier = async (configuration: Configuration) => {
  const api = new DossierApi(configuration);

  const answerPostDossier = await inquirer.prompt([
    dossierTitleQuestion,
    numberOfDocumentsQuestion,
  ]);

  const createDossierBody: CreateDossierBody = {
    title: answerPostDossier.title,
    documentsMetadata: [],
  };

  // eslint-disable-next-line functional/no-let
  for (let i = 1; i <= answerPostDossier.number_of_documents; i++) {
    console.log(`Document ${i} of ${answerPostDossier.number_of_documents}`);
    const document = await newDocument();
    // eslint-disable-next-line functional/immutable-data
    createDossierBody.documentsMetadata.push(document);
  }

  return api.createDossier({ createDossierBody });
};

const newDocument = async () => {
  const answerNewDocument = await inquirer.prompt([
    documentTitleQuestion,
    numberOfSignaturesQuestion,
  ]);

  const document: DocumentMetadata = {
    title: answerNewDocument.document_title,
    signatureFields: [],
  };

  // eslint-disable-next-line functional/no-let
  for (let i = 0; i < answerNewDocument.number_of_signatures; i++) {
    const signature: SignatureField = await newSignature();
    // eslint-disable-next-line functional/immutable-data
    document.signatureFields.push(signature);
  }
  return document;
};

const newSignature = async () => {
  const answerNewSignature = await inquirer.prompt([
    clauseTitleQuestion,
    clauseTypeQuestion,
    clauseAttrsTypeQuestion,
  ]);

  const attrs =
    0 === "id univoco".localeCompare(answerNewSignature.command)
      ? await addUniqueName()
      : await addCoords();

  const signature: SignatureField = {
    attrs,
    clause: {
      title: answerNewSignature.clause_title,
      type: answerNewSignature.clause_type,
    },
  };
  return signature;
};

const addCoords = async () => {
  const answerAddCoords = await inquirer.prompt([
    clauseAttrsXCoordsQuestion,
    clauseAttrsYCoordsQuestion,
    clauseAttrsHeightCoordsQuestion,
    clauseAttrsWidthCoordsQuestion,
    clauseAttrsPageCoordsQuestion,
  ]);
  const attrs: SignatureFieldAttrs = {
    uniqueName: "",
    coordinates: { x: answerAddCoords.x_coords, y: answerAddCoords.y_coords },
    page: answerAddCoords.page_corrds,
    size: { w: answerAddCoords.width_coords, h: answerAddCoords.height_coords },
  };
  return attrs;
};

const addUniqueName = async () => {
  const answerAddUniqueName = await inquirer.prompt([clauseAttrsIdQuestion]);
  const attrs: SignatureFieldAttrs = {
    uniqueName: answerAddUniqueName.id,
    coordinates: { x: 0, y: 0 },
    page: 0,
    size: { w: 0, h: 0 },
  };
  return attrs;
};

const callGetDossier = async (configuration: Configuration) => {
  const api = new DossierApi(configuration);
  const answerGetDossier = await inquirer.prompt([
    {
      dossierIdQuestion,
    },
  ]);
  return api.getDossier(answerGetDossier.id);
};
