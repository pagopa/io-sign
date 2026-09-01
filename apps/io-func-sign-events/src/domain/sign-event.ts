import { z } from "zod";

// zod v4 enforces RFC 4122 version digit [1-8]; use this for IDs with non-standard versions
const uuid = z
  .string()
  .regex(
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/i
  );

export const EventName = z.enum([
  "io.sign.signature_request.created",
  "io.sign.signature_request.document.uploaded",
  "io.sign.signature_request.document.rejected",
  "io.sign.signature_request.ready",
  "io.sign.signature_request.notification.sent",
  "io.sign.signature_request.cancelled",
  "io.sign.signature_request.wait_for_signature",
  "io.sign.signature_request.wait_for_qtsp",
  "io.sign.qtsp.certificate.created",
  "io.sign.qtsp.certificate.rejected",
  "io.sign.qtsp.api.error",
  "io.sign.signature_request.rejected",
  "io.sign.signature_request.signed",
  "io.sign.signature_request.notification.rejected"
]);

export type EventName = z.infer<typeof EventName>;

const document = z.object({ id: z.ulid(), status: z.string() }).loose();

const signatureRequestBase = z.object({
  id: z.ulid(),
  signerId: uuid,
  // issuerId can be a ULID (new records) or a UUID (legacy records)
  issuerId: z.union([uuid, z.ulid()]),
  issuerEmail: z.email(),
  issuerDescription: z.string(),
  issuerInternalInstitutionId: uuid,
  issuerEnvironment: z.enum(["TEST", "DEFAULT", "INTERNAL"]),
  issuerDepartment: z.string(),
  dossierId: z.ulid(),
  dossierTitle: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  expiresAt: z.string()
});

const signatureRequest = z.discriminatedUnion("status", [
  signatureRequestBase.extend({
    status: z.literal("DRAFT"),
    documents: z.array(document)
  }),
  signatureRequestBase.extend({
    status: z.literal("READY"),
    documents: z.array(document)
  }),
  signatureRequestBase.extend({
    status: z.literal("WAIT_FOR_SIGNATURE"),
    qrCodeUrl: z.string(),
    documents: z.array(document)
  }),
  signatureRequestBase.extend({
    status: z.literal("WAIT_FOR_QTSP"),
    qrCodeUrl: z.string(),
    documents: z.array(document)
  }),
  signatureRequestBase.extend({
    status: z.literal("SIGNED"),
    signedAt: z.string(),
    documents: z.array(document)
  }),
  signatureRequestBase.extend({
    status: z.literal("REJECTED"),
    rejectedAt: z.string(),
    rejectReason: z.string(),
    qrCodeUrl: z.string(),
    documents: z.array(document)
  }),
  signatureRequestBase.extend({
    status: z.literal("CANCELLED"),
    cancelledAt: z.string(),
    qrCodeUrl: z.string(),
    documents: z.array(document)
  })
]);

export type SignatureRequest = z.infer<typeof signatureRequest>;

export const SignEvent = z.discriminatedUnion("payloadType", [
  z.object({
    eventId: z.ulid(),
    eventName: EventName,
    payloadType: z.literal("signature_request"),
    payload: z.object({
      signatureRequest
    })
  }),
  z.object({
    eventId: z.ulid(),
    eventName: EventName,
    payloadType: z.literal("signature_request_document"),
    payload: z.object({
      signatureRequest,
      documentId: z.ulid()
    })
  })
]);

export type SignEvent = z.infer<typeof SignEvent>;
