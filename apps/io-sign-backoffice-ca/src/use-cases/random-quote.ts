import { z } from "zod";

export async function getRandomQuote() {
  const response = await fetch("https://api.quotable.io/random", {
    next: { revalidate: 10 },
  });
  const json = await response.json();
  const schema = z.object({
    content: z.string().nonempty(),
  });
  const quote = schema.parse(json).content;
  return quote;
}
