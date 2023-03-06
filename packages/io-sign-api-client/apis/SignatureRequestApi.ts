// TODO: better import syntax?
import {BaseAPIRequestFactory, RequiredError, COLLECTION_FORMATS} from './baseapi';
import {Configuration} from '../configuration';
import {RequestContext, HttpMethod, ResponseContext, HttpFile} from '../http/http';
import {ObjectSerializer} from '../models/ObjectSerializer';
import {ApiException} from './exception';
import {canConsumeForm, isCodeInRange} from '../util';
import {SecurityAuthentication} from '../auth/auth';


import { CreateSignatureRequestBody } from '../models/CreateSignatureRequestBody';
import { NotificationDetailView } from '../models/NotificationDetailView';
import { ProblemDetail } from '../models/ProblemDetail';
import { SignatureRequestDetailView } from '../models/SignatureRequestDetailView';

/**
 * no description
 */
export class SignatureRequestApiRequestFactory extends BaseAPIRequestFactory {

    /**
     * Create a Signature Request
     * @param createSignatureRequestBody 
     */
    public async createSignatureRequest(createSignatureRequestBody: CreateSignatureRequestBody, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'createSignatureRequestBody' is not null or undefined
        if (createSignatureRequestBody === null || createSignatureRequestBody === undefined) {
            throw new RequiredError("SignatureRequestApi", "createSignatureRequest", "createSignatureRequestBody");
        }


        // Path Params
        const localVarPath = '/signature-requests';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.POST);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")


        // Body Params
        const contentType = ObjectSerializer.getPreferredMediaType([
            "application/json"
        ]);
        requestContext.setHeaderParam("Content-Type", contentType);
        const serializedBody = ObjectSerializer.stringify(
            ObjectSerializer.serialize(createSignatureRequestBody, "CreateSignatureRequestBody", ""),
            contentType
        );
        requestContext.setBody(serializedBody);

        let authMethod: SecurityAuthentication | undefined;
        // Apply auth methods
        authMethod = _config.authMethods["SubscriptionKey"]
        if (authMethod?.applySecurityAuthentication) {
            await authMethod?.applySecurityAuthentication(requestContext);
        }
        
        const defaultAuth: SecurityAuthentication | undefined = _options?.authMethods?.default || this.configuration?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

    /**
     * Get the Upload Url for the specified document
     * @param reqId 
     * @param docId 
     */
    public async getDocumentUploadUrl(reqId: string, docId: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'reqId' is not null or undefined
        if (reqId === null || reqId === undefined) {
            throw new RequiredError("SignatureRequestApi", "getDocumentUploadUrl", "reqId");
        }


        // verify required parameter 'docId' is not null or undefined
        if (docId === null || docId === undefined) {
            throw new RequiredError("SignatureRequestApi", "getDocumentUploadUrl", "docId");
        }


        // Path Params
        const localVarPath = '/signature-requests/{req_id}/documents/{doc_id}/upload_url'
            .replace('{' + 'req_id' + '}', encodeURIComponent(String(reqId)))
            .replace('{' + 'doc_id' + '}', encodeURIComponent(String(docId)));

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")


        let authMethod: SecurityAuthentication | undefined;
        // Apply auth methods
        authMethod = _config.authMethods["SubscriptionKey"]
        if (authMethod?.applySecurityAuthentication) {
            await authMethod?.applySecurityAuthentication(requestContext);
        }
        
        const defaultAuth: SecurityAuthentication | undefined = _options?.authMethods?.default || this.configuration?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

    /**
     * Get a Signature Request by Id
     * @param id 
     */
    public async getSignatureRequest(id: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'id' is not null or undefined
        if (id === null || id === undefined) {
            throw new RequiredError("SignatureRequestApi", "getSignatureRequest", "id");
        }


        // Path Params
        const localVarPath = '/signature-requests/{id}'
            .replace('{' + 'id' + '}', encodeURIComponent(String(id)));

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.GET);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")


        let authMethod: SecurityAuthentication | undefined;
        // Apply auth methods
        authMethod = _config.authMethods["SubscriptionKey"]
        if (authMethod?.applySecurityAuthentication) {
            await authMethod?.applySecurityAuthentication(requestContext);
        }
        
        const defaultAuth: SecurityAuthentication | undefined = _options?.authMethods?.default || this.configuration?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

    /**
     * Send a signature request notification to user via IO message
     * @param reqId 
     */
    public async sendNotification(reqId: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'reqId' is not null or undefined
        if (reqId === null || reqId === undefined) {
            throw new RequiredError("SignatureRequestApi", "sendNotification", "reqId");
        }


        // Path Params
        const localVarPath = '/signature-requests/{req_id}/notification'
            .replace('{' + 'req_id' + '}', encodeURIComponent(String(reqId)));

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.PUT);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")


        let authMethod: SecurityAuthentication | undefined;
        // Apply auth methods
        authMethod = _config.authMethods["SubscriptionKey"]
        if (authMethod?.applySecurityAuthentication) {
            await authMethod?.applySecurityAuthentication(requestContext);
        }
        
        const defaultAuth: SecurityAuthentication | undefined = _options?.authMethods?.default || this.configuration?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

    /**
     * Set the status of a Signature Request
     * @param id 
     * @param body 
     */
    public async setSignatureRequestStatus(id: string, body: string, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'id' is not null or undefined
        if (id === null || id === undefined) {
            throw new RequiredError("SignatureRequestApi", "setSignatureRequestStatus", "id");
        }


        // verify required parameter 'body' is not null or undefined
        if (body === null || body === undefined) {
            throw new RequiredError("SignatureRequestApi", "setSignatureRequestStatus", "body");
        }


        // Path Params
        const localVarPath = '/signature-requests/{id}/status'
            .replace('{' + 'id' + '}', encodeURIComponent(String(id)));

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.PUT);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")


        // Body Params
        const contentType = ObjectSerializer.getPreferredMediaType([
            "application/json"
        ]);
        requestContext.setHeaderParam("Content-Type", contentType);
        const serializedBody = ObjectSerializer.stringify(
            ObjectSerializer.serialize(body, "string", ""),
            contentType
        );
        requestContext.setBody(serializedBody);

        let authMethod: SecurityAuthentication | undefined;
        // Apply auth methods
        authMethod = _config.authMethods["SubscriptionKey"]
        if (authMethod?.applySecurityAuthentication) {
            await authMethod?.applySecurityAuthentication(requestContext);
        }
        
        const defaultAuth: SecurityAuthentication | undefined = _options?.authMethods?.default || this.configuration?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

}

export class SignatureRequestApiResponseProcessor {

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to createSignatureRequest
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async createSignatureRequest(response: ResponseContext): Promise<SignatureRequestDetailView > {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("201", response.httpStatusCode)) {
            const body: SignatureRequestDetailView = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "SignatureRequestDetailView", ""
            ) as SignatureRequestDetailView;
            return body;
        }
        if (isCodeInRange("400", response.httpStatusCode)) {
            const body: ProblemDetail = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ProblemDetail", ""
            ) as ProblemDetail;
            throw new ApiException<ProblemDetail>(response.httpStatusCode, "Validation error on body", body, response.headers);
        }
        if (isCodeInRange("401", response.httpStatusCode)) {
            const body: ProblemDetail = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ProblemDetail", ""
            ) as ProblemDetail;
            throw new ApiException<ProblemDetail>(response.httpStatusCode, "Unauthorized", body, response.headers);
        }
        if (isCodeInRange("403", response.httpStatusCode)) {
            const body: ProblemDetail = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ProblemDetail", ""
            ) as ProblemDetail;
            throw new ApiException<ProblemDetail>(response.httpStatusCode, "You don&#39;t have enough privileges to perform this action", body, response.headers);
        }
        if (isCodeInRange("429", response.httpStatusCode)) {
            const body: ProblemDetail = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ProblemDetail", ""
            ) as ProblemDetail;
            throw new ApiException<ProblemDetail>(response.httpStatusCode, "Too Many Requests", body, response.headers);
        }
        if (isCodeInRange("0", response.httpStatusCode)) {
            const body: ProblemDetail = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ProblemDetail", ""
            ) as ProblemDetail;
            throw new ApiException<ProblemDetail>(response.httpStatusCode, "Unexpected error", body, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: SignatureRequestDetailView = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "SignatureRequestDetailView", ""
            ) as SignatureRequestDetailView;
            return body;
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getDocumentUploadUrl
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getDocumentUploadUrl(response: ResponseContext): Promise<string > {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: string = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "string", "string"
            ) as string;
            return body;
        }
        if (isCodeInRange("400", response.httpStatusCode)) {
            const body: ProblemDetail = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ProblemDetail", "string"
            ) as ProblemDetail;
            throw new ApiException<ProblemDetail>(response.httpStatusCode, "Validation error on body", body, response.headers);
        }
        if (isCodeInRange("401", response.httpStatusCode)) {
            const body: ProblemDetail = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ProblemDetail", "string"
            ) as ProblemDetail;
            throw new ApiException<ProblemDetail>(response.httpStatusCode, "Unauthorized", body, response.headers);
        }
        if (isCodeInRange("403", response.httpStatusCode)) {
            const body: ProblemDetail = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ProblemDetail", "string"
            ) as ProblemDetail;
            throw new ApiException<ProblemDetail>(response.httpStatusCode, "You don&#39;t have enough privileges to perform this action", body, response.headers);
        }
        if (isCodeInRange("404", response.httpStatusCode)) {
            const body: ProblemDetail = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ProblemDetail", "string"
            ) as ProblemDetail;
            throw new ApiException<ProblemDetail>(response.httpStatusCode, "The specified resource was not found", body, response.headers);
        }
        if (isCodeInRange("429", response.httpStatusCode)) {
            const body: ProblemDetail = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ProblemDetail", "string"
            ) as ProblemDetail;
            throw new ApiException<ProblemDetail>(response.httpStatusCode, "Too Many Requests", body, response.headers);
        }
        if (isCodeInRange("0", response.httpStatusCode)) {
            const body: ProblemDetail = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ProblemDetail", "string"
            ) as ProblemDetail;
            throw new ApiException<ProblemDetail>(response.httpStatusCode, "Unexpected error", body, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: string = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "string", "string"
            ) as string;
            return body;
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getSignatureRequest
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getSignatureRequest(response: ResponseContext): Promise<SignatureRequestDetailView > {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("200", response.httpStatusCode)) {
            const body: SignatureRequestDetailView = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "SignatureRequestDetailView", ""
            ) as SignatureRequestDetailView;
            return body;
        }
        if (isCodeInRange("400", response.httpStatusCode)) {
            const body: ProblemDetail = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ProblemDetail", ""
            ) as ProblemDetail;
            throw new ApiException<ProblemDetail>(response.httpStatusCode, "Validation error on body", body, response.headers);
        }
        if (isCodeInRange("401", response.httpStatusCode)) {
            const body: ProblemDetail = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ProblemDetail", ""
            ) as ProblemDetail;
            throw new ApiException<ProblemDetail>(response.httpStatusCode, "Unauthorized", body, response.headers);
        }
        if (isCodeInRange("403", response.httpStatusCode)) {
            const body: ProblemDetail = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ProblemDetail", ""
            ) as ProblemDetail;
            throw new ApiException<ProblemDetail>(response.httpStatusCode, "You don&#39;t have enough privileges to perform this action", body, response.headers);
        }
        if (isCodeInRange("429", response.httpStatusCode)) {
            const body: ProblemDetail = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ProblemDetail", ""
            ) as ProblemDetail;
            throw new ApiException<ProblemDetail>(response.httpStatusCode, "Too Many Requests", body, response.headers);
        }
        if (isCodeInRange("0", response.httpStatusCode)) {
            const body: ProblemDetail = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ProblemDetail", ""
            ) as ProblemDetail;
            throw new ApiException<ProblemDetail>(response.httpStatusCode, "Unexpected error", body, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: SignatureRequestDetailView = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "SignatureRequestDetailView", ""
            ) as SignatureRequestDetailView;
            return body;
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to sendNotification
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async sendNotification(response: ResponseContext): Promise<NotificationDetailView > {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("201", response.httpStatusCode)) {
            const body: NotificationDetailView = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "NotificationDetailView", ""
            ) as NotificationDetailView;
            return body;
        }
        if (isCodeInRange("400", response.httpStatusCode)) {
            const body: ProblemDetail = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ProblemDetail", ""
            ) as ProblemDetail;
            throw new ApiException<ProblemDetail>(response.httpStatusCode, "Validation error on body", body, response.headers);
        }
        if (isCodeInRange("401", response.httpStatusCode)) {
            const body: ProblemDetail = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ProblemDetail", ""
            ) as ProblemDetail;
            throw new ApiException<ProblemDetail>(response.httpStatusCode, "Unauthorized", body, response.headers);
        }
        if (isCodeInRange("403", response.httpStatusCode)) {
            const body: ProblemDetail = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ProblemDetail", ""
            ) as ProblemDetail;
            throw new ApiException<ProblemDetail>(response.httpStatusCode, "You don&#39;t have enough privileges to perform this action", body, response.headers);
        }
        if (isCodeInRange("429", response.httpStatusCode)) {
            const body: ProblemDetail = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ProblemDetail", ""
            ) as ProblemDetail;
            throw new ApiException<ProblemDetail>(response.httpStatusCode, "Too Many Requests", body, response.headers);
        }
        if (isCodeInRange("0", response.httpStatusCode)) {
            const body: ProblemDetail = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ProblemDetail", ""
            ) as ProblemDetail;
            throw new ApiException<ProblemDetail>(response.httpStatusCode, "Unexpected error", body, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: NotificationDetailView = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "NotificationDetailView", ""
            ) as NotificationDetailView;
            return body;
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to setSignatureRequestStatus
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async setSignatureRequestStatus(response: ResponseContext): Promise<void > {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("204", response.httpStatusCode)) {
            return;
        }
        if (isCodeInRange("400", response.httpStatusCode)) {
            const body: ProblemDetail = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ProblemDetail", ""
            ) as ProblemDetail;
            throw new ApiException<ProblemDetail>(response.httpStatusCode, "Validation error on body", body, response.headers);
        }
        if (isCodeInRange("401", response.httpStatusCode)) {
            const body: ProblemDetail = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ProblemDetail", ""
            ) as ProblemDetail;
            throw new ApiException<ProblemDetail>(response.httpStatusCode, "Unauthorized", body, response.headers);
        }
        if (isCodeInRange("403", response.httpStatusCode)) {
            const body: ProblemDetail = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ProblemDetail", ""
            ) as ProblemDetail;
            throw new ApiException<ProblemDetail>(response.httpStatusCode, "You don&#39;t have enough privileges to perform this action", body, response.headers);
        }
        if (isCodeInRange("404", response.httpStatusCode)) {
            const body: ProblemDetail = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ProblemDetail", ""
            ) as ProblemDetail;
            throw new ApiException<ProblemDetail>(response.httpStatusCode, "The specified resource was not found", body, response.headers);
        }
        if (isCodeInRange("429", response.httpStatusCode)) {
            const body: ProblemDetail = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ProblemDetail", ""
            ) as ProblemDetail;
            throw new ApiException<ProblemDetail>(response.httpStatusCode, "Too Many Requests", body, response.headers);
        }
        if (isCodeInRange("0", response.httpStatusCode)) {
            const body: ProblemDetail = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ProblemDetail", ""
            ) as ProblemDetail;
            throw new ApiException<ProblemDetail>(response.httpStatusCode, "Unexpected error", body, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: void = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "void", ""
            ) as void;
            return body;
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

}
