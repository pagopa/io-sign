/* tslint:disable */
/* eslint-disable */
/**
 * Firma con IO - Issuer API
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: 1.1.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */


import * as runtime from '../runtime';
import type {
  CreateSignatureRequestBody,
  NotificationDetailView,
  ProblemDetail,
  SignatureRequestDetailView,
} from '../models';
import {
    CreateSignatureRequestBodyFromJSON,
    CreateSignatureRequestBodyToJSON,
    NotificationDetailViewFromJSON,
    NotificationDetailViewToJSON,
    ProblemDetailFromJSON,
    ProblemDetailToJSON,
    SignatureRequestDetailViewFromJSON,
    SignatureRequestDetailViewToJSON,
} from '../models';

export interface CreateSignatureRequestRequest {
    createSignatureRequestBody: CreateSignatureRequestBody;
}

export interface GetDocumentUploadUrlRequest {
    reqId: string;
    docId: string;
}

export interface GetSignatureRequestRequest {
    id: string;
}

export interface SendNotificationRequest {
    reqId: string;
}

export interface SetSignatureRequestStatusRequest {
    id: string;
    body: string;
}

/**
 * 
 */
export class SignatureRequestApi extends runtime.BaseAPI {

    /**
     * Create a Signature Request
     */
    async createSignatureRequestRaw(requestParameters: CreateSignatureRequestRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<SignatureRequestDetailView>> {
        if (requestParameters.createSignatureRequestBody === null || requestParameters.createSignatureRequestBody === undefined) {
            throw new runtime.RequiredError('createSignatureRequestBody','Required parameter requestParameters.createSignatureRequestBody was null or undefined when calling createSignatureRequest.');
        }

        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        headerParameters['Content-Type'] = 'application/json';

        if (this.configuration && this.configuration.apiKey) {
            headerParameters["Ocp-Apim-Subscription-Key"] = this.configuration.apiKey("Ocp-Apim-Subscription-Key"); // SubscriptionKey authentication
        }

        const response = await this.request({
            path: `/signature-requests`,
            method: 'POST',
            headers: headerParameters,
            query: queryParameters,
            body: CreateSignatureRequestBodyToJSON(requestParameters.createSignatureRequestBody),
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => SignatureRequestDetailViewFromJSON(jsonValue));
    }

    /**
     * Create a Signature Request
     */
    async createSignatureRequest(requestParameters: CreateSignatureRequestRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<SignatureRequestDetailView> {
        const response = await this.createSignatureRequestRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * Get the Upload Url for the specified document
     */
    async getDocumentUploadUrlRaw(requestParameters: GetDocumentUploadUrlRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<string>> {
        if (requestParameters.reqId === null || requestParameters.reqId === undefined) {
            throw new runtime.RequiredError('reqId','Required parameter requestParameters.reqId was null or undefined when calling getDocumentUploadUrl.');
        }

        if (requestParameters.docId === null || requestParameters.docId === undefined) {
            throw new runtime.RequiredError('docId','Required parameter requestParameters.docId was null or undefined when calling getDocumentUploadUrl.');
        }

        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        if (this.configuration && this.configuration.apiKey) {
            headerParameters["Ocp-Apim-Subscription-Key"] = this.configuration.apiKey("Ocp-Apim-Subscription-Key"); // SubscriptionKey authentication
        }

        const response = await this.request({
            path: `/signature-requests/{req_id}/documents/{doc_id}/upload_url`.replace(`{${"req_id"}}`, encodeURIComponent(String(requestParameters.reqId))).replace(`{${"doc_id"}}`, encodeURIComponent(String(requestParameters.docId))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.TextApiResponse(response) as any;
    }

    /**
     * Get the Upload Url for the specified document
     */
    async getDocumentUploadUrl(requestParameters: GetDocumentUploadUrlRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<string> {
        const response = await this.getDocumentUploadUrlRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * Get a Signature Request by Id
     */
    async getSignatureRequestRaw(requestParameters: GetSignatureRequestRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<SignatureRequestDetailView>> {
        if (requestParameters.id === null || requestParameters.id === undefined) {
            throw new runtime.RequiredError('id','Required parameter requestParameters.id was null or undefined when calling getSignatureRequest.');
        }

        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        if (this.configuration && this.configuration.apiKey) {
            headerParameters["Ocp-Apim-Subscription-Key"] = this.configuration.apiKey("Ocp-Apim-Subscription-Key"); // SubscriptionKey authentication
        }

        const response = await this.request({
            path: `/signature-requests/{id}`.replace(`{${"id"}}`, encodeURIComponent(String(requestParameters.id))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => SignatureRequestDetailViewFromJSON(jsonValue));
    }

    /**
     * Get a Signature Request by Id
     */
    async getSignatureRequest(requestParameters: GetSignatureRequestRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<SignatureRequestDetailView> {
        const response = await this.getSignatureRequestRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * Send a signature request notification to user via IO message
     */
    async sendNotificationRaw(requestParameters: SendNotificationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<NotificationDetailView>> {
        if (requestParameters.reqId === null || requestParameters.reqId === undefined) {
            throw new runtime.RequiredError('reqId','Required parameter requestParameters.reqId was null or undefined when calling sendNotification.');
        }

        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        if (this.configuration && this.configuration.apiKey) {
            headerParameters["Ocp-Apim-Subscription-Key"] = this.configuration.apiKey("Ocp-Apim-Subscription-Key"); // SubscriptionKey authentication
        }

        const response = await this.request({
            path: `/signature-requests/{req_id}/notification`.replace(`{${"req_id"}}`, encodeURIComponent(String(requestParameters.reqId))),
            method: 'PUT',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => NotificationDetailViewFromJSON(jsonValue));
    }

    /**
     * Send a signature request notification to user via IO message
     */
    async sendNotification(requestParameters: SendNotificationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<NotificationDetailView> {
        const response = await this.sendNotificationRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * Set the status of a Signature Request
     */
    async setSignatureRequestStatusRaw(requestParameters: SetSignatureRequestStatusRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<void>> {
        if (requestParameters.id === null || requestParameters.id === undefined) {
            throw new runtime.RequiredError('id','Required parameter requestParameters.id was null or undefined when calling setSignatureRequestStatus.');
        }

        if (requestParameters.body === null || requestParameters.body === undefined) {
            throw new runtime.RequiredError('body','Required parameter requestParameters.body was null or undefined when calling setSignatureRequestStatus.');
        }

        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        headerParameters['Content-Type'] = 'application/json';

        if (this.configuration && this.configuration.apiKey) {
            headerParameters["Ocp-Apim-Subscription-Key"] = this.configuration.apiKey("Ocp-Apim-Subscription-Key"); // SubscriptionKey authentication
        }

        const response = await this.request({
            path: `/signature-requests/{id}/status`.replace(`{${"id"}}`, encodeURIComponent(String(requestParameters.id))),
            method: 'PUT',
            headers: headerParameters,
            query: queryParameters,
            body: requestParameters.body as any,
        }, initOverrides);

        return new runtime.VoidApiResponse(response);
    }

    /**
     * Set the status of a Signature Request
     */
    async setSignatureRequestStatus(requestParameters: SetSignatureRequestStatusRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<void> {
        await this.setSignatureRequestStatusRaw(requestParameters, initOverrides);
    }

}
