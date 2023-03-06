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

import { ObservableDossierApi } from "./ObservableAPI";
import { DossierApiRequestFactory, DossierApiResponseProcessor} from "../apis/DossierApi";

export interface DossierApiCreateDossierRequest {
    /**
     * 
     * @type CreateDossierBody
     * @memberof DossierApicreateDossier
     */
    createDossierBody: CreateDossierBody
}

export interface DossierApiGetDossierRequest {
    /**
     * 
     * @type string
     * @memberof DossierApigetDossier
     */
    id: string
}

export class ObjectDossierApi {
    private api: ObservableDossierApi

    public constructor(configuration: Configuration, requestFactory?: DossierApiRequestFactory, responseProcessor?: DossierApiResponseProcessor) {
        this.api = new ObservableDossierApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Create a Dossier
     * @param param the request object
     */
    public createDossier(param: DossierApiCreateDossierRequest, options?: Configuration): Promise<DossierDetailView> {
        return this.api.createDossier(param.createDossierBody,  options).toPromise();
    }

    /**
     * Get a Dossier by Id
     * @param param the request object
     */
    public getDossier(param: DossierApiGetDossierRequest, options?: Configuration): Promise<DossierDetailView> {
        return this.api.getDossier(param.id,  options).toPromise();
    }

}

import { ObservableSignatureRequestApi } from "./ObservableAPI";
import { SignatureRequestApiRequestFactory, SignatureRequestApiResponseProcessor} from "../apis/SignatureRequestApi";

export interface SignatureRequestApiCreateSignatureRequestRequest {
    /**
     * 
     * @type CreateSignatureRequestBody
     * @memberof SignatureRequestApicreateSignatureRequest
     */
    createSignatureRequestBody: CreateSignatureRequestBody
}

export interface SignatureRequestApiGetDocumentUploadUrlRequest {
    /**
     * 
     * @type string
     * @memberof SignatureRequestApigetDocumentUploadUrl
     */
    reqId: string
    /**
     * 
     * @type string
     * @memberof SignatureRequestApigetDocumentUploadUrl
     */
    docId: string
}

export interface SignatureRequestApiGetSignatureRequestRequest {
    /**
     * 
     * @type string
     * @memberof SignatureRequestApigetSignatureRequest
     */
    id: string
}

export interface SignatureRequestApiSendNotificationRequest {
    /**
     * 
     * @type string
     * @memberof SignatureRequestApisendNotification
     */
    reqId: string
}

export interface SignatureRequestApiSetSignatureRequestStatusRequest {
    /**
     * 
     * @type string
     * @memberof SignatureRequestApisetSignatureRequestStatus
     */
    id: string
    /**
     * 
     * @type string
     * @memberof SignatureRequestApisetSignatureRequestStatus
     */
    body: string
}

export class ObjectSignatureRequestApi {
    private api: ObservableSignatureRequestApi

    public constructor(configuration: Configuration, requestFactory?: SignatureRequestApiRequestFactory, responseProcessor?: SignatureRequestApiResponseProcessor) {
        this.api = new ObservableSignatureRequestApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Create a Signature Request
     * @param param the request object
     */
    public createSignatureRequest(param: SignatureRequestApiCreateSignatureRequestRequest, options?: Configuration): Promise<SignatureRequestDetailView> {
        return this.api.createSignatureRequest(param.createSignatureRequestBody,  options).toPromise();
    }

    /**
     * Get the Upload Url for the specified document
     * @param param the request object
     */
    public getDocumentUploadUrl(param: SignatureRequestApiGetDocumentUploadUrlRequest, options?: Configuration): Promise<string> {
        return this.api.getDocumentUploadUrl(param.reqId, param.docId,  options).toPromise();
    }

    /**
     * Get a Signature Request by Id
     * @param param the request object
     */
    public getSignatureRequest(param: SignatureRequestApiGetSignatureRequestRequest, options?: Configuration): Promise<SignatureRequestDetailView> {
        return this.api.getSignatureRequest(param.id,  options).toPromise();
    }

    /**
     * Send a signature request notification to user via IO message
     * @param param the request object
     */
    public sendNotification(param: SignatureRequestApiSendNotificationRequest, options?: Configuration): Promise<NotificationDetailView> {
        return this.api.sendNotification(param.reqId,  options).toPromise();
    }

    /**
     * Set the status of a Signature Request
     * @param param the request object
     */
    public setSignatureRequestStatus(param: SignatureRequestApiSetSignatureRequestStatusRequest, options?: Configuration): Promise<void> {
        return this.api.setSignatureRequestStatus(param.id, param.body,  options).toPromise();
    }

}

import { ObservableSignerApi } from "./ObservableAPI";
import { SignerApiRequestFactory, SignerApiResponseProcessor} from "../apis/SignerApi";

export interface SignerApiGetSignerByFiscalCodeRequest {
    /**
     * 
     * @type GetSignerByFiscalCodeBody
     * @memberof SignerApigetSignerByFiscalCode
     */
    getSignerByFiscalCodeBody: GetSignerByFiscalCodeBody
}

export class ObjectSignerApi {
    private api: ObservableSignerApi

    public constructor(configuration: Configuration, requestFactory?: SignerApiRequestFactory, responseProcessor?: SignerApiResponseProcessor) {
        this.api = new ObservableSignerApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Get Signer By Fiscal COde
     * @param param the request object
     */
    public getSignerByFiscalCode(param: SignerApiGetSignerByFiscalCodeRequest, options?: Configuration): Promise<SignerDetailView> {
        return this.api.getSignerByFiscalCode(param.getSignerByFiscalCodeBody,  options).toPromise();
    }

}
