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
 * @interface DossierDetailView
 */
export interface DossierDetailView {
    /**
     * Entity Id
     * @type {string}
     * @memberof DossierDetailView
     */
    id: string;
    /**
     * 
     * @type {string}
     * @memberof DossierDetailView
     */
    title: string;
    /**
     * Issuer's support email for a specific dossier.
     * @type {string}
     * @memberof DossierDetailView
     */
    supportEmail?: string;
    /**
     * 
     * @type {Array<DocumentMetadata>}
     * @memberof DossierDetailView
     */
    documentsMetadata: Array<DocumentMetadata>;
    /**
     * A date-time field in ISO-8601 format and UTC timezone.
     * @type {string}
     * @memberof DossierDetailView
     */
    createdAt: string;
    /**
     * A date-time field in ISO-8601 format and UTC timezone.
     * @type {string}
     * @memberof DossierDetailView
     */
    updatedAt: string;
}

/**
 * Check if a given object implements the DossierDetailView interface.
 */
export function instanceOfDossierDetailView(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "id" in value;
    isInstance = isInstance && "title" in value;
    isInstance = isInstance && "documentsMetadata" in value;
    isInstance = isInstance && "createdAt" in value;
    isInstance = isInstance && "updatedAt" in value;

    return isInstance;
}

export function DossierDetailViewFromJSON(json: any): DossierDetailView {
    return DossierDetailViewFromJSONTyped(json, false);
}

export function DossierDetailViewFromJSONTyped(json: any, ignoreDiscriminator: boolean): DossierDetailView {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'id': json['id'],
        'title': json['title'],
        'supportEmail': !exists(json, 'support_email') ? undefined : json['support_email'],
        'documentsMetadata': ((json['documents_metadata'] as Array<any>).map(DocumentMetadataFromJSON)),
        'createdAt': json['created_at'],
        'updatedAt': json['updated_at'],
    };
}

export function DossierDetailViewToJSON(value?: DossierDetailView | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'id': value.id,
        'title': value.title,
        'support_email': value.supportEmail,
        'documents_metadata': ((value.documentsMetadata as Array<any>).map(DocumentMetadataToJSON)),
        'created_at': value.createdAt,
        'updated_at': value.updatedAt,
    };
}

