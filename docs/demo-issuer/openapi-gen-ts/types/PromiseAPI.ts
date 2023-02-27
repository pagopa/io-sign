import { ResponseContext, RequestContext, HttpFile } from '../http/http';
import { Configuration} from '../configuration'

import { Clause } from '../models/Clause';
import { CreateDossierBody } from '../models/CreateDossierBody';
import { CreateSignatureRequestBody } from '../models/CreateSignatureRequestBody';
import { Document } from '../models/Document';
import { DocumentDetailView } from '../models/DocumentDetailView';
import { DocumentMetadata } from '../models/DocumentMetadata';
import { DocumentReady } from '../models/DocumentReady';
import { DocumentReadyAllOf } from '../models/DocumentReadyAllOf';
import { DocumentRejected } from '../models/DocumentRejected';
import { DocumentRejectedAllOf } from '../models/DocumentRejectedAllOf';
import { DocumentToBeUploaded } from '../models/DocumentToBeUploaded';
import { DocumentToBeUploadedAllOf } from '../models/DocumentToBeUploadedAllOf';
import { DocumentToBeValidated } from '../models/DocumentToBeValidated';
import { DocumentToBeValidatedAllOf } from '../models/DocumentToBeValidatedAllOf';
import { DossierDetailView } from '../models/DossierDetailView';
import { ExistingSignatureFieldAttrs } from '../models/ExistingSignatureFieldAttrs';
import { GetSignerByFiscalCodeBody } from '../models/GetSignerByFiscalCodeBody';
import { NotificationDetailView } from '../models/NotificationDetailView';
import { ProblemDetail } from '../models/ProblemDetail';
import { SignatureField } from '../models/SignatureField';
import { SignatureFieldAttrs } from '../models/SignatureFieldAttrs';
import { SignatureFieldToBeCreatedAttrs } from '../models/SignatureFieldToBeCreatedAttrs';
import { SignatureFieldToBeCreatedAttrsCoordinates } from '../models/SignatureFieldToBeCreatedAttrsCoordinates';
import { SignatureFieldToBeCreatedAttrsSize } from '../models/SignatureFieldToBeCreatedAttrsSize';
import { SignatureRequestDetailView } from '../models/SignatureRequestDetailView';
import { SignerDetailView } from '../models/SignerDetailView';
import { ObservableDossierApi } from './ObservableAPI';

import { DossierApiRequestFactory, DossierApiResponseProcessor} from "../apis/DossierApi";
export class PromiseDossierApi {
    private api: ObservableDossierApi

    public constructor(
        configuration: Configuration,
        requestFactory?: DossierApiRequestFactory,
        responseProcessor?: DossierApiResponseProcessor
    ) {
        this.api = new ObservableDossierApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Create a Dossier
     * @param createDossierBody 
     */
    public createDossier(createDossierBody: CreateDossierBody, _options?: Configuration): Promise<DossierDetailView> {
        const result = this.api.createDossier(createDossierBody, _options);
        return result.toPromise();
    }

    /**
     * Get a Dossier by Id
     * @param id 
     */
    public getDossier(id: string, _options?: Configuration): Promise<DossierDetailView> {
        const result = this.api.getDossier(id, _options);
        return result.toPromise();
    }


}



import { ObservableSignatureRequestApi } from './ObservableAPI';

import { SignatureRequestApiRequestFactory, SignatureRequestApiResponseProcessor} from "../apis/SignatureRequestApi";
export class PromiseSignatureRequestApi {
    private api: ObservableSignatureRequestApi

    public constructor(
        configuration: Configuration,
        requestFactory?: SignatureRequestApiRequestFactory,
        responseProcessor?: SignatureRequestApiResponseProcessor
    ) {
        this.api = new ObservableSignatureRequestApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Create a Signature Request
     * @param createSignatureRequestBody 
     */
    public createSignatureRequest(createSignatureRequestBody: CreateSignatureRequestBody, _options?: Configuration): Promise<SignatureRequestDetailView> {
        const result = this.api.createSignatureRequest(createSignatureRequestBody, _options);
        return result.toPromise();
    }

    /**
     * Get the Upload Url for the specified document
     * @param reqId 
     * @param docId 
     */
    public getDocumentUploadUrl(reqId: string, docId: string, _options?: Configuration): Promise<string> {
        const result = this.api.getDocumentUploadUrl(reqId, docId, _options);
        return result.toPromise();
    }

    /**
     * Get a Signature Request by Id
     * @param id 
     */
    public getSignatureRequest(id: string, _options?: Configuration): Promise<SignatureRequestDetailView> {
        const result = this.api.getSignatureRequest(id, _options);
        return result.toPromise();
    }

    /**
     * Send a signature request notification to user via IO message
     * @param reqId 
     */
    public sendNotification(reqId: string, _options?: Configuration): Promise<NotificationDetailView> {
        const result = this.api.sendNotification(reqId, _options);
        return result.toPromise();
    }

    /**
     * Set the status of a Signature Request
     * @param id 
     * @param body 
     */
    public setSignatureRequestStatus(id: string, body: string, _options?: Configuration): Promise<void> {
        const result = this.api.setSignatureRequestStatus(id, body, _options);
        return result.toPromise();
    }


}



import { ObservableSignerApi } from './ObservableAPI';

import { SignerApiRequestFactory, SignerApiResponseProcessor} from "../apis/SignerApi";
export class PromiseSignerApi {
    private api: ObservableSignerApi

    public constructor(
        configuration: Configuration,
        requestFactory?: SignerApiRequestFactory,
        responseProcessor?: SignerApiResponseProcessor
    ) {
        this.api = new ObservableSignerApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get Signer By Fiscal COde
     * @param getSignerByFiscalCodeBody 
     */
    public getSignerByFiscalCode(getSignerByFiscalCodeBody: GetSignerByFiscalCodeBody, _options?: Configuration): Promise<SignerDetailView> {
        const result = this.api.getSignerByFiscalCode(getSignerByFiscalCodeBody, _options);
        return result.toPromise();
    }


}



