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
 * @interface CreateDossierBody
 */
export interface CreateDossierBody {
    /**
     * 
     * @type {string}
     * @memberof CreateDossierBody
     */
    title: string;
    /**
     * Issuer's support email for a specific dossier.
     * @type {string}
     * @memberof CreateDossierBody
     */
    supportEmail?: string;
    /**
     * 
     * @type {Array<DocumentMetadata>}
     * @memberof CreateDossierBody
     */
    documentsMetadata: Array<DocumentMetadata>;
}

/**
 * Check if a given object implements the CreateDossierBody interface.
 */
export function instanceOfCreateDossierBody(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "title" in value;
    isInstance = isInstance && "documentsMetadata" in value;

    return isInstance;
}

export function CreateDossierBodyFromJSON(json: any): CreateDossierBody {
    return CreateDossierBodyFromJSONTyped(json, false);
}

export function CreateDossierBodyFromJSONTyped(json: any, ignoreDiscriminator: boolean): CreateDossierBody {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'title': json['title'],
        'supportEmail': !exists(json, 'support_email') ? undefined : json['support_email'],
        'documentsMetadata': ((json['documents_metadata'] as Array<any>).map(DocumentMetadataFromJSON)),
    };
}

export function CreateDossierBodyToJSON(value?: CreateDossierBody | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'title': value.title,
        'support_email': value.supportEmail,
        'documents_metadata': ((value.documentsMetadata as Array<any>).map(DocumentMetadataToJSON)),
    };
}

