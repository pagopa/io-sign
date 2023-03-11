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
import type { DocumentMetadata } from './DocumentMetadata';
import {
    DocumentMetadataFromJSON,
    DocumentMetadataFromJSONTyped,
    DocumentMetadataToJSON,
} from './DocumentMetadata';

/**
 * 
 * @export
 * @interface Document
 */
export interface Document {
    /**
     * Entity Id
     * @type {string}
     * @memberof Document
     */
    id: string;
    /**
     * 
     * @type {DocumentMetadata}
     * @memberof Document
     */
    metadata: DocumentMetadata;
    /**
     * A date-time field in ISO-8601 format and UTC timezone.
     * @type {string}
     * @memberof Document
     */
    createdAt: string;
    /**
     * A date-time field in ISO-8601 format and UTC timezone.
     * @type {string}
     * @memberof Document
     */
    updatedAt: string;
}

/**
 * Check if a given object implements the Document interface.
 */
export function instanceOfDocument(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "id" in value;
    isInstance = isInstance && "metadata" in value;
    isInstance = isInstance && "createdAt" in value;
    isInstance = isInstance && "updatedAt" in value;

    return isInstance;
}

export function DocumentFromJSON(json: any): Document {
    return DocumentFromJSONTyped(json, false);
}

export function DocumentFromJSONTyped(json: any, ignoreDiscriminator: boolean): Document {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'id': json['id'],
        'metadata': DocumentMetadataFromJSON(json['metadata']),
        'createdAt': json['created_at'],
        'updatedAt': json['updated_at'],
    };
}

export function DocumentToJSON(value?: Document | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'id': value.id,
        'metadata': DocumentMetadataToJSON(value.metadata),
        'created_at': value.createdAt,
        'updated_at': value.updatedAt,
    };
}

