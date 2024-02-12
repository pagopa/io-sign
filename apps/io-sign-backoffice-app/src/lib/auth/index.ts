import { z } from "zod";

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

export type User = z.infer<typeof userSchema>;
