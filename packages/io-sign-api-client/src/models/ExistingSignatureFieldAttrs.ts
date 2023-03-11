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
 * @interface ExistingSignatureFieldAttrs
 */
export interface ExistingSignatureFieldAttrs {
    /**
     * 
     * @type {string}
     * @memberof ExistingSignatureFieldAttrs
     */
    uniqueName: string;
}

/**
 * Check if a given object implements the ExistingSignatureFieldAttrs interface.
 */
export function instanceOfExistingSignatureFieldAttrs(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "uniqueName" in value;

    return isInstance;
}

export function ExistingSignatureFieldAttrsFromJSON(json: any): ExistingSignatureFieldAttrs {
    return ExistingSignatureFieldAttrsFromJSONTyped(json, false);
}

export function ExistingSignatureFieldAttrsFromJSONTyped(json: any, ignoreDiscriminator: boolean): ExistingSignatureFieldAttrs {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'uniqueName': json['unique_name'],
    };
}

export function ExistingSignatureFieldAttrsToJSON(value?: ExistingSignatureFieldAttrs | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'unique_name': value.uniqueName,
    };
}

