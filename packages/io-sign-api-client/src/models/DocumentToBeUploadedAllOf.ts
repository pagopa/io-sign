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

import { exists, mapValues } from '../runtime';
/**
 * 
 * @export
 * @interface DocumentToBeUploadedAllOf
 */
export interface DocumentToBeUploadedAllOf {
    /**
     * 
     * @type {string}
     * @memberof DocumentToBeUploadedAllOf
     */
    status: DocumentToBeUploadedAllOfStatusEnum;
}


/**
 * @export
 */
export const DocumentToBeUploadedAllOfStatusEnum = {
    WaitForUpload: 'WAIT_FOR_UPLOAD'
} as const;
export type DocumentToBeUploadedAllOfStatusEnum = typeof DocumentToBeUploadedAllOfStatusEnum[keyof typeof DocumentToBeUploadedAllOfStatusEnum];


/**
 * Check if a given object implements the DocumentToBeUploadedAllOf interface.
 */
export function instanceOfDocumentToBeUploadedAllOf(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "status" in value;

    return isInstance;
}

export function DocumentToBeUploadedAllOfFromJSON(json: any): DocumentToBeUploadedAllOf {
    return DocumentToBeUploadedAllOfFromJSONTyped(json, false);
}

export function DocumentToBeUploadedAllOfFromJSONTyped(json: any, ignoreDiscriminator: boolean): DocumentToBeUploadedAllOf {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'status': json['status'],
    };
}

export function DocumentToBeUploadedAllOfToJSON(value?: DocumentToBeUploadedAllOf | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'status': value.status,
    };
}

