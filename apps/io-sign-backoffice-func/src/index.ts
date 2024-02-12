import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(1),
  surname: z.string().min(1),
  email: z.string().email(),
});

export type Contact = z.TypeOf<typeof contactSchema>;
