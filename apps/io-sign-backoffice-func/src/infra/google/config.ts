import { z } from "zod";

const ConfigFromEnvironment = z
  .object({
    GOOGLE_PRIVATE_KEY: z.string().min(1),
    GOOGLE_CLIENT_EMAIL: z.string().email(),
    GOOGLE_SPREADSHEET_ID: z.string().min(1),
  })
  .transform((e) => ({
    credentials: {
      type: "service_account",
      private_key: Buffer.from(e.GOOGLE_PRIVATE_KEY, "base64").toString(),
      client_email: e.GOOGLE_CLIENT_EMAIL,
    },
    spreadsheetId: e.GOOGLE_SPREADSHEET_ID,
  }));

export type GoogleConfig = z.infer<typeof ConfigFromEnvironment>;

export const getGoogleConfigFromEnvironment = () => {
  const result = ConfigFromEnvironment.safeParse(process.env);
  if (!result.success) {
    throw new Error("error parsing back office config", {
      cause: result.error.issues,
    });
  }
  return result.data;
};
