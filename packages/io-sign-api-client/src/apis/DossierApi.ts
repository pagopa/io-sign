/* tslint:disable */
/* eslint-disable */
/**
 * Firma con IO - Issuer API
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: 1.2.1
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */


import * as runtime from '../runtime';
import type {
  CreateDossierBody,
  DossierDetailView,
  ProblemDetail,
  SignatureRequestList,
} from '../models';
import {
    CreateDossierBodyFromJSON,
    CreateDossierBodyToJSON,
    DossierDetailViewFromJSON,
    DossierDetailViewToJSON,
    ProblemDetailFromJSON,
    ProblemDetailToJSON,
    SignatureRequestListFromJSON,
    SignatureRequestListToJSON,
} from '../models';

export interface CreateDossierRequest {
    createDossierBody: CreateDossierBody;
}

export interface GetDossierRequest {
    id: string;
}

export interface GetRequestsByDossierRequest {
    id: string;
    continuationToken?: string;
    limit?: number;
}

/**
 * 
 */
export class DossierApi extends runtime.BaseAPI {

    /**
     * Create a Dossier
     */
    async createDossierRaw(requestParameters: CreateDossierRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<DossierDetailView>> {
        if (requestParameters.createDossierBody === null || requestParameters.createDossierBody === undefined) {
            throw new runtime.RequiredError('createDossierBody','Required parameter requestParameters.createDossierBody was null or undefined when calling createDossier.');
        }

        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        headerParameters['Content-Type'] = 'application/json';

        if (this.configuration && this.configuration.apiKey) {
            headerParameters["Ocp-Apim-Subscription-Key"] = this.configuration.apiKey("Ocp-Apim-Subscription-Key"); // SubscriptionKey authentication
        }

        const response = await this.request({
            path: `/dossiers`,
            method: 'POST',
            headers: headerParameters,
            query: queryParameters,
            body: CreateDossierBodyToJSON(requestParameters.createDossierBody),
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => DossierDetailViewFromJSON(jsonValue));
    }

    /**
     * Create a Dossier
     */
    async createDossier(requestParameters: CreateDossierRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<DossierDetailView> {
        const response = await this.createDossierRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * Get a Dossier by Id
     */
    async getDossierRaw(requestParameters: GetDossierRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<DossierDetailView>> {
        if (requestParameters.id === null || requestParameters.id === undefined) {
            throw new runtime.RequiredError('id','Required parameter requestParameters.id was null or undefined when calling getDossier.');
        }

        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        if (this.configuration && this.configuration.apiKey) {
            headerParameters["Ocp-Apim-Subscription-Key"] = this.configuration.apiKey("Ocp-Apim-Subscription-Key"); // SubscriptionKey authentication
        }

        const response = await this.request({
            path: `/dossiers/{id}`.replace(`{${"id"}}`, encodeURIComponent(String(requestParameters.id))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => DossierDetailViewFromJSON(jsonValue));
    }

    /**
     * Get a Dossier by Id
     */
    async getDossier(requestParameters: GetDossierRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<DossierDetailView> {
        const response = await this.getDossierRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * Get the Signature Requests created from a Dossier
     */
    async getRequestsByDossierRaw(requestParameters: GetRequestsByDossierRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<SignatureRequestList>> {
        if (requestParameters.id === null || requestParameters.id === undefined) {
            throw new runtime.RequiredError('id','Required parameter requestParameters.id was null or undefined when calling getRequestsByDossier.');
        }

        const queryParameters: any = {};

        if (requestParameters.continuationToken !== undefined) {
            queryParameters['continuationToken'] = requestParameters.continuationToken;
        }

        if (requestParameters.limit !== undefined) {
            queryParameters['limit'] = requestParameters.limit;
        }

        const headerParameters: runtime.HTTPHeaders = {};

        if (this.configuration && this.configuration.apiKey) {
            headerParameters["Ocp-Apim-Subscription-Key"] = this.configuration.apiKey("Ocp-Apim-Subscription-Key"); // SubscriptionKey authentication
        }

        const response = await this.request({
            path: `/dossiers/{id}/signature-requests`.replace(`{${"id"}}`, encodeURIComponent(String(requestParameters.id))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => SignatureRequestListFromJSON(jsonValue));
    }

    /**
     * Get the Signature Requests created from a Dossier
     */
    async getRequestsByDossier(requestParameters: GetRequestsByDossierRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<SignatureRequestList> {
        const response = await this.getRequestsByDossierRaw(requestParameters, initOverrides);
        return await response.value();
    }

}
