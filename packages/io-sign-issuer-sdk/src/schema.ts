import {
  DossierDetailView,
  SignatureRequestDetailView,
  GetRequestsByDossierRequest,
} from "@io-sign/io-sign-api-client";

export type SdkSchema = {
  fiscalCode?: string;
  signatureRequest?: Partial<SignatureRequestDetailView>;
  dossier?: Partial<DossierDetailView>;
  signatureRequests?: Partial<GetRequestsByDossierRequest>;
  documentsPaths: string[];
};

export type SdkSchemaWithSignatureRequest = SdkSchema & {
  signatureRequest: SignatureRequestDetailView;
};

export type SdkSchemaWithDossier = SdkSchema & {
  dossier: DossierDetailView;
};
