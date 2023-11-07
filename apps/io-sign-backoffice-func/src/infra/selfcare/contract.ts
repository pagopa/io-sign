import { z } from "zod";

const contract = z.object({
  id: z.string().min(1),
  internalIstitutionID: z.string().min(1),
  state: z.enum(["ACTIVE", "CLOSED"]),
  institution: z.object({
    address: z.string().min(1),
    description: z.string().min(1),
    digitalAddress: z.string().min(1),
    taxCode: z.string().min(1),
  }),
  billing: z.object({
    vatNumber: z.string().min(1),
  }),
  product: z.literal("prod-io-sign"),
});

const activeIoSignContract = contract.merge(
  z.object({ state: z.literal("ACTIVE") })
);

const closedIoSignContract = contract.merge(
  z.object({
    state: z.literal("CLOSED"),
  })
);

const ioSignContract = z.union([activeIoSignContract, closedIoSignContract]);

export const ioSignContracts = z.array(ioSignContract);

export type ActiveIoSignContract = z.infer<typeof activeIoSignContract>;

export type ClosedIoSignContract = z.infer<typeof closedIoSignContract>;

type IoSignContract = z.infer<typeof ioSignContract>;

export type IoSignContracts = z.infer<typeof ioSignContracts>;

export const isActive = (
  contract: IoSignContract
): contract is ActiveIoSignContract => contract.state === "ACTIVE";
