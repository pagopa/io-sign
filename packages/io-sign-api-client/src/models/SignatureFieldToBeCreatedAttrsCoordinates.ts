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
 * @interface SignatureFieldToBeCreatedAttrsCoordinates
 */
export interface SignatureFieldToBeCreatedAttrsCoordinates {
    /**
     * 
     * @type {number}
     * @memberof SignatureFieldToBeCreatedAttrsCoordinates
     */
    x: number;
    /**
     * 
     * @type {number}
     * @memberof SignatureFieldToBeCreatedAttrsCoordinates
     */
    y: number;
}

/**
 * Check if a given object implements the SignatureFieldToBeCreatedAttrsCoordinates interface.
 */
export function instanceOfSignatureFieldToBeCreatedAttrsCoordinates(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "x" in value;
    isInstance = isInstance && "y" in value;

    return isInstance;
}

export function SignatureFieldToBeCreatedAttrsCoordinatesFromJSON(json: any): SignatureFieldToBeCreatedAttrsCoordinates {
    return SignatureFieldToBeCreatedAttrsCoordinatesFromJSONTyped(json, false);
}

export function SignatureFieldToBeCreatedAttrsCoordinatesFromJSONTyped(json: any, ignoreDiscriminator: boolean): SignatureFieldToBeCreatedAttrsCoordinates {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'x': json['x'],
        'y': json['y'],
    };
}

export function SignatureFieldToBeCreatedAttrsCoordinatesToJSON(value?: SignatureFieldToBeCreatedAttrsCoordinates | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'x': value.x,
        'y': value.y,
    };
}

