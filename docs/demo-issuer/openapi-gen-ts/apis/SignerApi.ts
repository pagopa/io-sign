// TODO: better import syntax?
import {BaseAPIRequestFactory, RequiredError, COLLECTION_FORMATS} from './baseapi';
import {Configuration} from '../configuration';
import {RequestContext, HttpMethod, ResponseContext, HttpFile} from '../http/http';
import {ObjectSerializer} from '../models/ObjectSerializer';
import {ApiException} from './exception';
import {canConsumeForm, isCodeInRange} from '../util';
import {SecurityAuthentication} from '../auth/auth';


import { GetSignerByFiscalCodeBody } from '../models/GetSignerByFiscalCodeBody';
import { ProblemDetail } from '../models/ProblemDetail';
import { SignerDetailView } from '../models/SignerDetailView';

/**
 * no description
 */
export class SignerApiRequestFactory extends BaseAPIRequestFactory {

    /**
     * Get Signer By Fiscal COde
     * @param getSignerByFiscalCodeBody 
     */
    public async getSignerByFiscalCode(getSignerByFiscalCodeBody: GetSignerByFiscalCodeBody, _options?: Configuration): Promise<RequestContext> {
        let _config = _options || this.configuration;

        // verify required parameter 'getSignerByFiscalCodeBody' is not null or undefined
        if (getSignerByFiscalCodeBody === null || getSignerByFiscalCodeBody === undefined) {
            throw new RequiredError("SignerApi", "getSignerByFiscalCode", "getSignerByFiscalCodeBody");
        }


        // Path Params
        const localVarPath = '/signers';

        // Make Request Context
        const requestContext = _config.baseServer.makeRequestContext(localVarPath, HttpMethod.POST);
        requestContext.setHeaderParam("Accept", "application/json, */*;q=0.8")


        // Body Params
        const contentType = ObjectSerializer.getPreferredMediaType([
            "application/json"
        ]);
        requestContext.setHeaderParam("Content-Type", contentType);
        const serializedBody = ObjectSerializer.stringify(
            ObjectSerializer.serialize(getSignerByFiscalCodeBody, "GetSignerByFiscalCodeBody", ""),
            contentType
        );
        requestContext.setBody(serializedBody);

        let authMethod: SecurityAuthentication | undefined;
        // Apply auth methods
        authMethod = _config.authMethods["SubscriptionKey"]
        if (authMethod?.applySecurityAuthentication) {
            await authMethod?.applySecurityAuthentication(requestContext);
        }
        
        const defaultAuth: SecurityAuthentication | undefined = _options?.authMethods?.default || this.configuration?.authMethods?.default
        if (defaultAuth?.applySecurityAuthentication) {
            await defaultAuth?.applySecurityAuthentication(requestContext);
        }

        return requestContext;
    }

}

export class SignerApiResponseProcessor {

    /**
     * Unwraps the actual response sent by the server from the response context and deserializes the response content
     * to the expected objects
     *
     * @params response Response returned by the server for a request to getSignerByFiscalCode
     * @throws ApiException if the response code was not in [200, 299]
     */
     public async getSignerByFiscalCode(response: ResponseContext): Promise<SignerDetailView > {
        const contentType = ObjectSerializer.normalizeMediaType(response.headers["content-type"]);
        if (isCodeInRange("201", response.httpStatusCode)) {
            const body: SignerDetailView = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "SignerDetailView", ""
            ) as SignerDetailView;
            return body;
        }
        if (isCodeInRange("400", response.httpStatusCode)) {
            const body: ProblemDetail = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ProblemDetail", ""
            ) as ProblemDetail;
            throw new ApiException<ProblemDetail>(response.httpStatusCode, "Validation error on body", body, response.headers);
        }
        if (isCodeInRange("401", response.httpStatusCode)) {
            const body: ProblemDetail = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ProblemDetail", ""
            ) as ProblemDetail;
            throw new ApiException<ProblemDetail>(response.httpStatusCode, "Unauthorized", body, response.headers);
        }
        if (isCodeInRange("403", response.httpStatusCode)) {
            const body: ProblemDetail = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ProblemDetail", ""
            ) as ProblemDetail;
            throw new ApiException<ProblemDetail>(response.httpStatusCode, "You don&#39;t have enough privileges to perform this action", body, response.headers);
        }
        if (isCodeInRange("429", response.httpStatusCode)) {
            const body: ProblemDetail = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ProblemDetail", ""
            ) as ProblemDetail;
            throw new ApiException<ProblemDetail>(response.httpStatusCode, "Too Many Requests", body, response.headers);
        }
        if (isCodeInRange("0", response.httpStatusCode)) {
            const body: ProblemDetail = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "ProblemDetail", ""
            ) as ProblemDetail;
            throw new ApiException<ProblemDetail>(response.httpStatusCode, "Unexpected error", body, response.headers);
        }

        // Work around for missing responses in specification, e.g. for petstore.yaml
        if (response.httpStatusCode >= 200 && response.httpStatusCode <= 299) {
            const body: SignerDetailView = ObjectSerializer.deserialize(
                ObjectSerializer.parse(await response.body.text(), contentType),
                "SignerDetailView", ""
            ) as SignerDetailView;
            return body;
        }

        throw new ApiException<string | Blob | undefined>(response.httpStatusCode, "Unknown API Status Code!", await response.getBodyAsAny(), response.headers);
    }

}
