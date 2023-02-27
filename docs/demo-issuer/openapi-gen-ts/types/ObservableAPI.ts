import { ResponseContext, RequestContext, HttpFile } from '../http/http';
import { Configuration} from '../configuration'
import { Observable, of, from } from '../rxjsStub';
import {mergeMap, map} from  '../rxjsStub';
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

import { DossierApiRequestFactory, DossierApiResponseProcessor} from "../apis/DossierApi";
export class ObservableDossierApi {
    private requestFactory: DossierApiRequestFactory;
    private responseProcessor: DossierApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: DossierApiRequestFactory,
        responseProcessor?: DossierApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new DossierApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new DossierApiResponseProcessor();
    }

    /**
     * Create a Dossier
     * @param createDossierBody 
     */
    public createDossier(createDossierBody: CreateDossierBody, _options?: Configuration): Observable<DossierDetailView> {
        const requestContextPromise = this.requestFactory.createDossier(createDossierBody, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (let middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (let middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.createDossier(rsp)));
            }));
    }

    /**
     * Get a Dossier by Id
     * @param id 
     */
    public getDossier(id: string, _options?: Configuration): Observable<DossierDetailView> {
        const requestContextPromise = this.requestFactory.getDossier(id, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (let middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (let middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getDossier(rsp)));
            }));
    }

}

import { SignatureRequestApiRequestFactory, SignatureRequestApiResponseProcessor} from "../apis/SignatureRequestApi";
export class ObservableSignatureRequestApi {
    private requestFactory: SignatureRequestApiRequestFactory;
    private responseProcessor: SignatureRequestApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: SignatureRequestApiRequestFactory,
        responseProcessor?: SignatureRequestApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new SignatureRequestApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new SignatureRequestApiResponseProcessor();
    }

    /**
     * Create a Signature Request
     * @param createSignatureRequestBody 
     */
    public createSignatureRequest(createSignatureRequestBody: CreateSignatureRequestBody, _options?: Configuration): Observable<SignatureRequestDetailView> {
        const requestContextPromise = this.requestFactory.createSignatureRequest(createSignatureRequestBody, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (let middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (let middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.createSignatureRequest(rsp)));
            }));
    }

    /**
     * Get the Upload Url for the specified document
     * @param reqId 
     * @param docId 
     */
    public getDocumentUploadUrl(reqId: string, docId: string, _options?: Configuration): Observable<string> {
        const requestContextPromise = this.requestFactory.getDocumentUploadUrl(reqId, docId, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (let middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (let middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getDocumentUploadUrl(rsp)));
            }));
    }

    /**
     * Get a Signature Request by Id
     * @param id 
     */
    public getSignatureRequest(id: string, _options?: Configuration): Observable<SignatureRequestDetailView> {
        const requestContextPromise = this.requestFactory.getSignatureRequest(id, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (let middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (let middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getSignatureRequest(rsp)));
            }));
    }

    /**
     * Send a signature request notification to user via IO message
     * @param reqId 
     */
    public sendNotification(reqId: string, _options?: Configuration): Observable<NotificationDetailView> {
        const requestContextPromise = this.requestFactory.sendNotification(reqId, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (let middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (let middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.sendNotification(rsp)));
            }));
    }

    /**
     * Set the status of a Signature Request
     * @param id 
     * @param body 
     */
    public setSignatureRequestStatus(id: string, body: string, _options?: Configuration): Observable<void> {
        const requestContextPromise = this.requestFactory.setSignatureRequestStatus(id, body, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (let middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (let middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.setSignatureRequestStatus(rsp)));
            }));
    }

}

import { SignerApiRequestFactory, SignerApiResponseProcessor} from "../apis/SignerApi";
export class ObservableSignerApi {
    private requestFactory: SignerApiRequestFactory;
    private responseProcessor: SignerApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: SignerApiRequestFactory,
        responseProcessor?: SignerApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new SignerApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new SignerApiResponseProcessor();
    }

    /**
     * Get Signer By Fiscal COde
     * @param getSignerByFiscalCodeBody 
     */
    public getSignerByFiscalCode(getSignerByFiscalCodeBody: GetSignerByFiscalCodeBody, _options?: Configuration): Observable<SignerDetailView> {
        const requestContextPromise = this.requestFactory.getSignerByFiscalCode(getSignerByFiscalCodeBody, _options);

        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (let middleware of this.configuration.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => this.configuration.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (let middleware of this.configuration.middleware) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getSignerByFiscalCode(rsp)));
            }));
    }

}
