import { z } from "zod";

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().optional(),
  firstName: z.string().nonempty(),
  lastName: z.string().nonempty(),
});

export type User = z.infer<typeof userSchema>;
