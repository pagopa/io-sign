/* tslint:disable */
/* eslint-disable */
/**
 * Firma con IO - Issuer API
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: 1.0.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import {
    DocumentReady,
    instanceOfDocumentReady,
    DocumentReadyFromJSON,
    DocumentReadyFromJSONTyped,
    DocumentReadyToJSON,
} from './DocumentReady';
import {
    DocumentRejected,
    instanceOfDocumentRejected,
    DocumentRejectedFromJSON,
    DocumentRejectedFromJSONTyped,
    DocumentRejectedToJSON,
} from './DocumentRejected';
import {
    DocumentToBeUploaded,
    instanceOfDocumentToBeUploaded,
    DocumentToBeUploadedFromJSON,
    DocumentToBeUploadedFromJSONTyped,
    DocumentToBeUploadedToJSON,
} from './DocumentToBeUploaded';
import {
    DocumentToBeValidated,
    instanceOfDocumentToBeValidated,
    DocumentToBeValidatedFromJSON,
    DocumentToBeValidatedFromJSONTyped,
    DocumentToBeValidatedToJSON,
} from './DocumentToBeValidated';

/**
 * @type DocumentDetailView
 * 
 * @export
 */
export type DocumentDetailView = DocumentReady | DocumentRejected | DocumentToBeUploaded | DocumentToBeValidated;

export function DocumentDetailViewFromJSON(json: any): DocumentDetailView {
    return DocumentDetailViewFromJSONTyped(json, false);
}

export function DocumentDetailViewFromJSONTyped(json: any, ignoreDiscriminator: boolean): DocumentDetailView {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return { ...DocumentReadyFromJSONTyped(json, true), ...DocumentRejectedFromJSONTyped(json, true), ...DocumentToBeUploadedFromJSONTyped(json, true), ...DocumentToBeValidatedFromJSONTyped(json, true) };
}

export function DocumentDetailViewToJSON(value?: DocumentDetailView | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }

    if (instanceOfDocumentReady(value)) {
        return DocumentReadyToJSON(value as DocumentReady);
    }
    if (instanceOfDocumentRejected(value)) {
        return DocumentRejectedToJSON(value as DocumentRejected);
    }
    if (instanceOfDocumentToBeUploaded(value)) {
        return DocumentToBeUploadedToJSON(value as DocumentToBeUploaded);
    }
    if (instanceOfDocumentToBeValidated(value)) {
        return DocumentToBeValidatedToJSON(value as DocumentToBeValidated);
    }

    return {};
}

