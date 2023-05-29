import {
  ClauseTypeEnum,
  Configuration,
  Document,
  DocumentReady,
  DocumentToBeUploaded,
  SignatureRequestApi,
} from "@io-sign/io-sign-api-client";
import { describe, expect, test, vi, beforeEach } from "vitest";
import { callSignatureRequests } from "../signature-request";
import { callDocumentUpload } from "../upload-file";

const documentToBeUploadedMocked: DocumentToBeUploaded = {
  id: "XXX",
  metadata: {
    title: "Document title",
    signatureFields: [
      {
        attrs: {
          coordinates: {
            x: 10,
            y: 10,
          },
          page: 0,
          size: {
            w: 10,
            h: 10,
          },
        },
        clause: {
          title: "signature",
          type: ClauseTypeEnum.Required,
        },
      },
    ],
  },
  createdAt: "2023-05-26T12:53:58.559Z",
  updatedAt: "2023-05-26T12:54:06.884Z",
  status: "WAIT_FOR_UPLOAD",
};
const documentUploadedMocked: DocumentReady = {
  id: "XXX",
  metadata: {
    title: "Document title",
    signatureFields: [
      {
        attrs: {
          coordinates: {
            x: 10,
            y: 10,
          },
          page: 0,
          size: {
            w: 10,
            h: 10,
          },
        },
        clause: {
          title: "signature",
          type: ClauseTypeEnum.Required,
        },
      },
    ],
  },
  createdAt: "2023-05-26T12:53:58.559Z",
  updatedAt: "2023-05-26T12:54:06.884Z",
  uploadedAt: "2023-05-26T12:54:06.884Z",
  url: "",
  status: "READY",
};
const getSignatureRequestWithDocumentsUploadedResponse = {
  id: "AAA",
  status: "DRAFT",
  dossierId: "AAA",
  signerId: "e648cebe-8cab-4020-882a-AAA",
  expiresAt: "2023-08-24T12:53:58.559Z",
  documents: [documentUploadedMocked],
  createdAt: "2023-05-26T12:53:58.559Z",
  updatedAt: "2023-05-26T12:54:21.635Z",
};

const getSignatureRequestWithWaitForSignatureStatusResponse = {
  id: "AAA",
  status: "WAIT_FOR_SIGNATURE",
  dossierId: "AAA",
  signerId: "e648cebe-8cab-4020-882a-AAA",
  expiresAt: "2023-08-24T12:53:58.559Z",
  documents: [documentUploadedMocked],
  createdAt: "2023-05-26T12:53:58.559Z",
  updatedAt: "2023-05-26T12:54:21.635Z",
};

const getSignatureResponse = {
  id: "AAA",
  status: "DRAFT",
  dossierId: "AAA",
  signerId: "e648cebe-8cab-4020-882a-AAA",
  expiresAt: "2023-08-24T12:53:58.559Z",
  documents: [documentToBeUploadedMocked],
  createdAt: "2023-05-26T12:53:58.559Z",
  updatedAt: "2023-05-26T12:54:21.635Z",
};

const getSignatureRequest = {
  signatureRequest: {
    id: "AAA",
    dossierId: "AAA",
    signerId: "AAA",
    documents: [
      {
        title: "document title",
        signatureFields: [
          {
            clause: {
              title: "Signature",
              type: "REQUIRED",
            },
            attrs: {
              coordinates: {
                x: 10,
                y: 10,
              },
              page: 0,
              size: {
                w: 10,
                h: 10,
              },
            },
          },
        ],
      },
    ],
  },
};

vi.mock("@io-sign/io-sign-api-client");
vi.mock("./upload-file");
const mockGetSignatureRequest = vi
  .spyOn(SignatureRequestApi.prototype, "getSignatureRequest")
  .mockImplementation(() => {
    return Promise.resolve(getSignatureResponse);
  });
const mockCreateSignatureRequest = vi
  .spyOn(SignatureRequestApi.prototype, "createSignatureRequest")
  .mockImplementation(() => {
    return Promise.resolve(getSignatureResponse);
  });
const mockGetDocumentUploadUrl = vi
  .spyOn(SignatureRequestApi.prototype, "getDocumentUploadUrl")
  .mockImplementation(() => {
    return Promise.resolve("www.example.com");
  });
const mockSendNotification = vi.spyOn(
  SignatureRequestApi.prototype,
  "sendNotification"
);
const mockSetSignatureRequestStatus = vi.spyOn(
  SignatureRequestApi.prototype,
  "setSignatureRequestStatus"
);
//const mockCallDocumentUpload = vi.spyOn(
describe("Signature Request APIs", () => {
  beforeEach(() => {
    mockGetSignatureRequest.mockClear();
    mockCreateSignatureRequest.mockClear();
    mockGetDocumentUploadUrl.mockClear();
    mockSendNotification.mockClear();
    mockSetSignatureRequestStatus.mockClear();
  });
  test("makes a call to retrieve only the signature request detail", async () => {
    const request = {
      signatureRequest: {
        id: "aaa",
      },
    };

    await callSignatureRequests({} as Configuration, request as any);
    expect(mockGetSignatureRequest).toBeCalledTimes(3); // it should be 8 times
    expect(mockCreateSignatureRequest).not.toBeCalled;
    expect(mockGetDocumentUploadUrl).not.toBeCalled;
    expect(mockSendNotification).not.toBeCalled;
    expect(mockSetSignatureRequestStatus).not.toBeCalled;
    expect(callDocumentUpload).not.toBeCalled;
  });

  test("makes a call to do only the creation of a new signature request", async () => {
    const request = {
      signatureRequest: {
        signerId: "AAA",
        dossierId: "BBB",
      },
    };

    await callSignatureRequests({} as Configuration, request as any);
    expect(mockGetSignatureRequest).toBeCalledTimes(3); // it should be 8 times
    expect(mockCreateSignatureRequest).toBeCalled;
    expect(mockGetDocumentUploadUrl).not.toBeCalled;
    expect(mockSendNotification).not.toBeCalled;
    expect(mockSetSignatureRequestStatus).not.toBeCalled;
    expect(callDocumentUpload).not.toBeCalled;
  });

  test("makes a call to set the signature request status to READY", async () => {
    const request = {
      signatureRequest: {
        id: "aaa",
      },
    };
    mockGetSignatureRequest.mockImplementation(() => {
      return Promise.resolve(getSignatureRequestWithDocumentsUploadedResponse);
    });
    await callSignatureRequests({} as Configuration, request as any);
    expect(mockGetSignatureRequest).toBeCalledTimes(3); // it should be 8 times
    expect(mockCreateSignatureRequest).not.toBeCalled;
    expect(mockGetDocumentUploadUrl).not.toBeCalled;
    expect(mockSendNotification).not.toBeCalled;
    expect(mockSetSignatureRequestStatus).toBeCalled;
    expect(callDocumentUpload).not.toBeCalled;
  });

  test("makes a call to send notification", async () => {
    const request = {
      signatureRequest: {
        id: "aaa",
      },
    };
    mockGetSignatureRequest.mockImplementation(() => {
      return Promise.resolve(
        getSignatureRequestWithWaitForSignatureStatusResponse
      );
    });
    await callSignatureRequests({} as Configuration, request as any);
    expect(mockGetSignatureRequest).toBeCalledTimes(3); // it should be 8 times
    expect(mockCreateSignatureRequest).not.toBeCalled;
    expect(mockGetDocumentUploadUrl).not.toBeCalled;
    expect(mockSendNotification).toBeCalled;
    expect(mockSetSignatureRequestStatus).not.toBeCalled;
    expect(callDocumentUpload).not.toBeCalled;
  });
});
