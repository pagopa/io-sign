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

import { exists, mapValues } from '../runtime';
/**
 * 
 * @export
 * @interface CreateSignatureRequestBody
 */
export interface CreateSignatureRequestBody {
    /**
     * Entity Id
     * @type {string}
     * @memberof CreateSignatureRequestBody
     */
    dossierId: string;
    /**
     * Entity Id
     * @type {string}
     * @memberof CreateSignatureRequestBody
     */
    signerId: string;
    /**
     * A date-time field in ISO-8601 format and UTC timezone.
     * @type {string}
     * @memberof CreateSignatureRequestBody
     */
    expiresAt?: string;
}

/**
 * Check if a given object implements the CreateSignatureRequestBody interface.
 */
export function instanceOfCreateSignatureRequestBody(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "dossierId" in value;
    isInstance = isInstance && "signerId" in value;

    return isInstance;
}

export function CreateSignatureRequestBodyFromJSON(json: any): CreateSignatureRequestBody {
    return CreateSignatureRequestBodyFromJSONTyped(json, false);
}

export function CreateSignatureRequestBodyFromJSONTyped(json: any, ignoreDiscriminator: boolean): CreateSignatureRequestBody {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'dossierId': json['dossier_id'],
        'signerId': json['signer_id'],
        'expiresAt': !exists(json, 'expires_at') ? undefined : json['expires_at'],
    };
}

export function CreateSignatureRequestBodyToJSON(value?: CreateSignatureRequestBody | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'dossier_id': value.dossierId,
        'signer_id': value.signerId,
        'expires_at': value.expiresAt,
    };
}

