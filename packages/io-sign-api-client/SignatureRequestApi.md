# .SignatureRequestApi

All URIs are relative to *https://api.io.pagopa.it/api/v1/sign*

Method | HTTP request | Description
------------- | ------------- | -------------
[**createSignatureRequest**](SignatureRequestApi.md#createSignatureRequest) | **POST** /signature-requests | Create a Signature Request
[**getDocumentUploadUrl**](SignatureRequestApi.md#getDocumentUploadUrl) | **GET** /signature-requests/{req_id}/documents/{doc_id}/upload_url | Get the Upload Url for the specified document
[**getSignatureRequest**](SignatureRequestApi.md#getSignatureRequest) | **GET** /signature-requests/{id} | Get a Signature Request by Id
[**sendNotification**](SignatureRequestApi.md#sendNotification) | **PUT** /signature-requests/{req_id}/notification | Send a signature request notification to user via IO message
[**setSignatureRequestStatus**](SignatureRequestApi.md#setSignatureRequestStatus) | **PUT** /signature-requests/{id}/status | Set the status of a Signature Request


# **createSignatureRequest**
> SignatureRequestDetailView createSignatureRequest(createSignatureRequestBody)


### Example


```typescript
import {  } from '';
import * as fs from 'fs';

const configuration = .createConfiguration();
const apiInstance = new .SignatureRequestApi(configuration);

let body:.SignatureRequestApiCreateSignatureRequestRequest = {
  // CreateSignatureRequestBody
  createSignatureRequestBody: {
    dossierId: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
    signerId: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
    expiresAt: "2018-10-13T00:00:00.000Z",
  },
};

apiInstance.createSignatureRequest(body).then((data:any) => {
  console.log('API called successfully. Returned data: ' + data);
}).catch((error:any) => console.error(error));
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **createSignatureRequestBody** | **CreateSignatureRequestBody**|  |


### Return type

**SignatureRequestDetailView**

### Authorization

[SubscriptionKey](README.md#SubscriptionKey)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**201** | The Signature Request detail |  -  |
**400** | Validation error on body |  -  |
**401** | Unauthorized |  -  |
**403** | You don&#39;t have enough privileges to perform this action |  -  |
**429** | Too Many Requests |  -  |
**0** | Unexpected error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getDocumentUploadUrl**
> string getDocumentUploadUrl()


### Example


```typescript
import {  } from '';
import * as fs from 'fs';

const configuration = .createConfiguration();
const apiInstance = new .SignatureRequestApi(configuration);

let body:.SignatureRequestApiGetDocumentUploadUrlRequest = {
  // string
  reqId: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
  // string
  docId: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
};

apiInstance.getDocumentUploadUrl(body).then((data:any) => {
  console.log('API called successfully. Returned data: ' + data);
}).catch((error:any) => console.error(error));
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **reqId** | [**string**] |  | defaults to undefined
 **docId** | [**string**] |  | defaults to undefined


### Return type

**string**

### Authorization

[SubscriptionKey](README.md#SubscriptionKey)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | The Upload Url |  -  |
**400** | Validation error on body |  -  |
**401** | Unauthorized |  -  |
**403** | You don&#39;t have enough privileges to perform this action |  -  |
**404** | The specified resource was not found |  -  |
**429** | Too Many Requests |  -  |
**0** | Unexpected error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getSignatureRequest**
> SignatureRequestDetailView getSignatureRequest()


### Example


```typescript
import {  } from '';
import * as fs from 'fs';

const configuration = .createConfiguration();
const apiInstance = new .SignatureRequestApi(configuration);

let body:.SignatureRequestApiGetSignatureRequestRequest = {
  // string
  id: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
};

apiInstance.getSignatureRequest(body).then((data:any) => {
  console.log('API called successfully. Returned data: ' + data);
}).catch((error:any) => console.error(error));
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | [**string**] |  | defaults to undefined


### Return type

**SignatureRequestDetailView**

### Authorization

[SubscriptionKey](README.md#SubscriptionKey)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | The Signature Request detail |  -  |
**400** | Validation error on body |  -  |
**401** | Unauthorized |  -  |
**403** | You don&#39;t have enough privileges to perform this action |  -  |
**429** | Too Many Requests |  -  |
**0** | Unexpected error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **sendNotification**
> NotificationDetailView sendNotification()


### Example


```typescript
import {  } from '';
import * as fs from 'fs';

const configuration = .createConfiguration();
const apiInstance = new .SignatureRequestApi(configuration);

let body:.SignatureRequestApiSendNotificationRequest = {
  // string
  reqId: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
};

apiInstance.sendNotification(body).then((data:any) => {
  console.log('API called successfully. Returned data: ' + data);
}).catch((error:any) => console.error(error));
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **reqId** | [**string**] |  | defaults to undefined


### Return type

**NotificationDetailView**

### Authorization

[SubscriptionKey](README.md#SubscriptionKey)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**201** | The notification detail |  -  |
**400** | Validation error on body |  -  |
**401** | Unauthorized |  -  |
**403** | You don&#39;t have enough privileges to perform this action |  -  |
**429** | Too Many Requests |  -  |
**0** | Unexpected error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **setSignatureRequestStatus**
> void setSignatureRequestStatus(body)


### Example


```typescript
import {  } from '';
import * as fs from 'fs';

const configuration = .createConfiguration();
const apiInstance = new .SignatureRequestApi(configuration);

let body:.SignatureRequestApiSetSignatureRequestStatusRequest = {
  // string
  id: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
  // string
  body: "body_example",
};

apiInstance.setSignatureRequestStatus(body).then((data:any) => {
  console.log('API called successfully. Returned data: ' + data);
}).catch((error:any) => console.error(error));
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **body** | **string**|  |
 **id** | [**string**] |  | defaults to undefined


### Return type

**void**

### Authorization

[SubscriptionKey](README.md#SubscriptionKey)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**204** | Signature Request status successfully set |  -  |
**400** | Validation error on body |  -  |
**401** | Unauthorized |  -  |
**403** | You don&#39;t have enough privileges to perform this action |  -  |
**404** | The specified resource was not found |  -  |
**429** | Too Many Requests |  -  |
**0** | Unexpected error |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)


