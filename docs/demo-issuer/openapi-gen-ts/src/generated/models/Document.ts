/**
 * Firma con IO - Issuer API
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * OpenAPI spec version: 1.0.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { DocumentMetadata } from '../models/DocumentMetadata';
import { HttpFile } from '../http/http';

export class Document {
    /**
    * Entity Id
    */
    'id': string;
    'metadata': DocumentMetadata;
    /**
    * A date-time field in ISO-8601 format and UTC timezone.
    */
    'createdAt': string;
    /**
    * A date-time field in ISO-8601 format and UTC timezone.
    */
    'updatedAt': string;

    static readonly discriminator: string | undefined = undefined;

    static readonly attributeTypeMap: Array<{name: string, baseName: string, type: string, format: string}> = [
        {
            "name": "id",
            "baseName": "id",
            "type": "string",
            "format": "NonEmptyString"
        },
        {
            "name": "metadata",
            "baseName": "metadata",
            "type": "DocumentMetadata",
            "format": ""
        },
        {
            "name": "createdAt",
            "baseName": "created_at",
            "type": "string",
            "format": "UTCISODateFromString"
        },
        {
            "name": "updatedAt",
            "baseName": "updated_at",
            "type": "string",
            "format": "UTCISODateFromString"
        }    ];

    static getAttributeTypeMap() {
        return Document.attributeTypeMap;
    }

    public constructor() {
    }
}

