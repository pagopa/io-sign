import { z } from "zod";

const institution = z.object({
  address: z.string().min(1),
  description: z.string().min(1),
  digitalAddress: z.string().min(1),
  taxCode: z.string().min(1),
});

const baseContract = z.object({
  id: z.string().min(1),
  internalIstitutionID: z.string().min(1),
  state: z.enum(["ACTIVE", "CLOSED"]),
  institution,
  billing: z.object({
    vatNumber: z.string().min(1),
  }),
  product: z.literal("prod-io-sign"),
});

const activeIoSignContract = baseContract.merge(
  z.object({ state: z.literal("ACTIVE") })
);

const closedIoSignContract = baseContract.merge(
  z.object({
    state: z.literal("CLOSED"),
  })
);

export type ActiveIoSignContract = z.infer<typeof activeIoSignContract>;

export type ClosedIoSignContract = z.infer<typeof closedIoSignContract>;

const ioSignContract = z.union([activeIoSignContract, closedIoSignContract]);

export type IoSignContract = z.infer<typeof ioSignContract>;

export const ioSignContracts = z.array(ioSignContract);

export type IoSignContracts = z.infer<typeof ioSignContracts>;

export const isActive = (
  contract: IoSignContract
): contract is ActiveIoSignContract => contract.state === "ACTIVE";
