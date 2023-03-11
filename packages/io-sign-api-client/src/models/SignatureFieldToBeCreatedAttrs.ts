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
import type { SignatureFieldToBeCreatedAttrsCoordinates } from './SignatureFieldToBeCreatedAttrsCoordinates';
import {
    SignatureFieldToBeCreatedAttrsCoordinatesFromJSON,
    SignatureFieldToBeCreatedAttrsCoordinatesFromJSONTyped,
    SignatureFieldToBeCreatedAttrsCoordinatesToJSON,
} from './SignatureFieldToBeCreatedAttrsCoordinates';
import type { SignatureFieldToBeCreatedAttrsSize } from './SignatureFieldToBeCreatedAttrsSize';
import {
    SignatureFieldToBeCreatedAttrsSizeFromJSON,
    SignatureFieldToBeCreatedAttrsSizeFromJSONTyped,
    SignatureFieldToBeCreatedAttrsSizeToJSON,
} from './SignatureFieldToBeCreatedAttrsSize';

/**
 * 
 * @export
 * @interface SignatureFieldToBeCreatedAttrs
 */
export interface SignatureFieldToBeCreatedAttrs {
    /**
     * 
     * @type {SignatureFieldToBeCreatedAttrsCoordinates}
     * @memberof SignatureFieldToBeCreatedAttrs
     */
    coordinates: SignatureFieldToBeCreatedAttrsCoordinates;
    /**
     * 
     * @type {number}
     * @memberof SignatureFieldToBeCreatedAttrs
     */
    page: number;
    /**
     * 
     * @type {SignatureFieldToBeCreatedAttrsSize}
     * @memberof SignatureFieldToBeCreatedAttrs
     */
    size: SignatureFieldToBeCreatedAttrsSize;
}

/**
 * Check if a given object implements the SignatureFieldToBeCreatedAttrs interface.
 */
export function instanceOfSignatureFieldToBeCreatedAttrs(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "coordinates" in value;
    isInstance = isInstance && "page" in value;
    isInstance = isInstance && "size" in value;

    return isInstance;
}

export function SignatureFieldToBeCreatedAttrsFromJSON(json: any): SignatureFieldToBeCreatedAttrs {
    return SignatureFieldToBeCreatedAttrsFromJSONTyped(json, false);
}

export function SignatureFieldToBeCreatedAttrsFromJSONTyped(json: any, ignoreDiscriminator: boolean): SignatureFieldToBeCreatedAttrs {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'coordinates': SignatureFieldToBeCreatedAttrsCoordinatesFromJSON(json['coordinates']),
        'page': json['page'],
        'size': SignatureFieldToBeCreatedAttrsSizeFromJSON(json['size']),
    };
}

export function SignatureFieldToBeCreatedAttrsToJSON(value?: SignatureFieldToBeCreatedAttrs | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'coordinates': SignatureFieldToBeCreatedAttrsCoordinatesToJSON(value.coordinates),
        'page': value.page,
        'size': SignatureFieldToBeCreatedAttrsSizeToJSON(value.size),
    };
}

