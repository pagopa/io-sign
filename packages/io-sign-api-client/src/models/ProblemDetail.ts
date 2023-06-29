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
 * @interface ProblemDetail
 */
export interface ProblemDetail {
    /**
     * An absolute URI that identifies the problem type. When dereferenced,
     * it SHOULD provide human-readable documentation for the problem type
     * (e.g., using HTML).
     * @type {string}
     * @memberof ProblemDetail
     */
    type?: string;
    /**
     * A short, summary of the problem type. Written in english and readable
     * for engineers (usually not suited for non technical stakeholders and
     * not localized); example: Service Unavailable
     * @type {string}
     * @memberof ProblemDetail
     */
    title?: string;
    /**
     * The HTTP status code generated by the origin server for this occurrence of the problem.
     * @type {number}
     * @memberof ProblemDetail
     */
    status?: number;
    /**
     * A human readable explanation specific to this occurrence of the
     * problem.
     * @type {string}
     * @memberof ProblemDetail
     */
    detail?: string;
    /**
     * An absolute URI that identifies the specific occurrence of the problem. It may or may not yield further information if dereferenced.
     * @type {string}
     * @memberof ProblemDetail
     */
    instance?: string;
}

/**
 * Check if a given object implements the ProblemDetail interface.
 */
export function instanceOfProblemDetail(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function ProblemDetailFromJSON(json: any): ProblemDetail {
    return ProblemDetailFromJSONTyped(json, false);
}

export function ProblemDetailFromJSONTyped(json: any, ignoreDiscriminator: boolean): ProblemDetail {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'type': !exists(json, 'type') ? undefined : json['type'],
        'title': !exists(json, 'title') ? undefined : json['title'],
        'status': !exists(json, 'status') ? undefined : json['status'],
        'detail': !exists(json, 'detail') ? undefined : json['detail'],
        'instance': !exists(json, 'instance') ? undefined : json['instance'],
    };
}

export function ProblemDetailToJSON(value?: ProblemDetail | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'type': value.type,
        'title': value.title,
        'status': value.status,
        'detail': value.detail,
        'instance': value.instance,
    };
}

