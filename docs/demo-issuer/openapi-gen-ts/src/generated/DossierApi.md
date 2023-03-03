# .DossierApi

All URIs are relative to *https://api.io.pagopa.it/api/v1/sign*

Method | HTTP request | Description
------------- | ------------- | -------------
[**createDossier**](DossierApi.md#createDossier) | **POST** /dossiers | Create a Dossier
[**getDossier**](DossierApi.md#getDossier) | **GET** /dossiers/{id} | Get a Dossier by Id


# **createDossier**
> DossierDetailView createDossier(createDossierBody)


### Example


```typescript
import {  } from '';
import * as fs from 'fs';

const configuration = .createConfiguration();
const apiInstance = new .DossierApi(configuration);

let body:.DossierApiCreateDossierRequest = {
  // CreateDossierBody
  createDossierBody: {
    title: "title_example",
    documentsMetadata: [
      {
        title: "title_example",
        signatureFields: [
          {
            attrs: null,
            clause: {
              title: "title_example",
              type: "REQUIRED",
            },
          },
        ],
      },
    ],
  },
};

apiInstance.createDossier(body).then((data:any) => {
  console.log('API called successfully. Returned data: ' + data);
}).catch((error:any) => console.error(error));
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **createDossierBody** | **CreateDossierBody**|  |


### Return type

**DossierDetailView**

### Authorization

[SubscriptionKey](README.md#SubscriptionKey)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**201** | The Dossier detail |  -  |
**400** | Validation error on body |  -  |
**401** | Unauthorized |  -  |
**403** | You don&#39;t have enough privileges to perform this action |  -  |
**429** | Too Many Requests |  -  |
**0** | Unexpected error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getDossier**
> DossierDetailView getDossier()


### Example


```typescript
import {  } from '';
import * as fs from 'fs';

const configuration = .createConfiguration();
const apiInstance = new .DossierApi(configuration);

let body:.DossierApiGetDossierRequest = {
  // string
  id: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
};

apiInstance.getDossier(body).then((data:any) => {
  console.log('API called successfully. Returned data: ' + data);
}).catch((error:any) => console.error(error));
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | [**string**] |  | defaults to undefined


### Return type

**DossierDetailView**

### Authorization

[SubscriptionKey](README.md#SubscriptionKey)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | The Dossier detail |  -  |
**400** | Validation error on body |  -  |
**401** | Unauthorized |  -  |
**403** | You don&#39;t have enough privileges to perform this action |  -  |
**404** | The specified resource was not found |  -  |
**429** | Too Many Requests |  -  |
**0** | Unexpected error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)


