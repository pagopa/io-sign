import { z } from "zod";

const contractSchema = z.object({
  id: z.string().min(1),
  internalIstitutionID: z.string().min(1),
  state: z.enum(["ACTIVE", "CLOSED"]),
  institution: z.object({
    address: z.string().min(1),
    description: z.string().min(1),
    digitalAddress: z.string().min(1),
    taxCode: z.string().min(1)
  }),
  billing: z
    .object({
      vatNumber: z.string().min(1).nullish()
    })
    .optional(),
  product: z.literal("prod-io-sign")
});

const activeIoSignContract = contractSchema.merge(
  z.object({ state: z.literal("ACTIVE") })
);

const closedIoSignContract = contractSchema.merge(
  z.object({
    state: z.literal("CLOSED")
  })
);

const ioSignContract = z.union([activeIoSignContract, closedIoSignContract]);

// Accept any array and silently discard contracts that don't belong to
// "prod-io-sign" (or are otherwise malformed), instead of throwing a
// ValidationError for every unrelated Selfcare product contract.
export const ioSignContracts = z.array(z.unknown()).transform((items) =>
  items.flatMap((item) => {
    const result = ioSignContract.safeParse(item);
    return result.success ? [result.data] : [];
  })
);

export type ActiveIoSignContract = z.infer<typeof activeIoSignContract>;

export type ClosedIoSignContract = z.infer<typeof closedIoSignContract>;

export type IoSignContracts = z.infer<typeof ioSignContracts>;

type IoSignContract = z.infer<typeof ioSignContract>;

export const isActive = (
  contract: IoSignContract
): contract is ActiveIoSignContract => contract.state === "ACTIVE";
