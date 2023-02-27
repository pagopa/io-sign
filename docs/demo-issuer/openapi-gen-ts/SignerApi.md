# .SignerApi

All URIs are relative to *https://api.io.pagopa.it/api/v1/sign*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getSignerByFiscalCode**](SignerApi.md#getSignerByFiscalCode) | **POST** /signers | Get Signer By Fiscal COde


# **getSignerByFiscalCode**
> SignerDetailView getSignerByFiscalCode(getSignerByFiscalCodeBody)


### Example


```typescript
import {  } from '';
import * as fs from 'fs';

const configuration = .createConfiguration();
const apiInstance = new .SignerApi(configuration);

let body:.SignerApiGetSignerByFiscalCodeRequest = {
  // GetSignerByFiscalCodeBody
  getSignerByFiscalCodeBody: {
    fiscalCode: "SPNDNL80R13C555X",
  },
};

apiInstance.getSignerByFiscalCode(body).then((data:any) => {
  console.log('API called successfully. Returned data: ' + data);
}).catch((error:any) => console.error(error));
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **getSignerByFiscalCodeBody** | **GetSignerByFiscalCodeBody**|  |


### Return type

**SignerDetailView**

### Authorization

[SubscriptionKey](README.md#SubscriptionKey)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**201** | The Signer detail |  -  |
**400** | Validation error on body |  -  |
**401** | Unauthorized |  -  |
**403** | You don&#39;t have enough privileges to perform this action |  -  |
**429** | Too Many Requests |  -  |
**0** | Unexpected error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)


