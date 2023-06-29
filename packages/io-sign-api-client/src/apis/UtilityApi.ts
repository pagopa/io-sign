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
  DocumentValidationResult,
  ProblemDetail,
  SignatureField,
} from '../models';
import {
    DocumentValidationResultFromJSON,
    DocumentValidationResultToJSON,
    ProblemDetailFromJSON,
    ProblemDetailToJSON,
    SignatureFieldFromJSON,
    SignatureFieldToJSON,
} from '../models';

export interface ValidateDocumentRequest {
    document: Blob;
    signatureFields?: Array<SignatureField>;
}

/**
 * 
 */
export class UtilityApi extends runtime.BaseAPI {

    /**
     * Validate a PDF document against a list of signature fields
     */
    async validateDocumentRaw(requestParameters: ValidateDocumentRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<DocumentValidationResult>> {
        if (requestParameters.document === null || requestParameters.document === undefined) {
            throw new runtime.RequiredError('document','Required parameter requestParameters.document was null or undefined when calling validateDocument.');
        }

        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        if (this.configuration && this.configuration.apiKey) {
            headerParameters["Ocp-Apim-Subscription-Key"] = this.configuration.apiKey("Ocp-Apim-Subscription-Key"); // SubscriptionKey authentication
        }

        const consumes: runtime.Consume[] = [
            { contentType: 'multipart/form-data' },
        ];
        // @ts-ignore: canConsumeForm may be unused
        const canConsumeForm = runtime.canConsumeForm(consumes);

        let formParams: { append(param: string, value: any): any };
        let useForm = false;
        // use FormData to transmit files using content-type "multipart/form-data"
        useForm = canConsumeForm;
        if (useForm) {
            formParams = new FormData();
        } else {
            formParams = new URLSearchParams();
        }

        if (requestParameters.document !== undefined) {
            formParams.append('document', requestParameters.document as any);
        }

        if (requestParameters.signatureFields) {
            formParams.append('signature_fields', requestParameters.signatureFields.join(runtime.COLLECTION_FORMATS["csv"]));
        }

        const response = await this.request({
            path: `/validate-document`,
            method: 'POST',
            headers: headerParameters,
            query: queryParameters,
            body: formParams,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => DocumentValidationResultFromJSON(jsonValue));
    }

    /**
     * Validate a PDF document against a list of signature fields
     */
    async validateDocument(requestParameters: ValidateDocumentRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<DocumentValidationResult> {
        const response = await this.validateDocumentRaw(requestParameters, initOverrides);
        return await response.value();
    }

}
