import { Suspense } from "react";

import { getRandomQuote } from "@/use-cases/random-quote";

import Box from "@/app/_components/mui/Box";
import Loading from "@/app/_components/Loading";

import Quote from "@/app/_components/Quote";

export default function Home() {
  const quote = getRandomQuote();
  return (
    <>
      <Suspense
        fallback={
          <Box p={2}>
            <Loading />
          </Box>
        }
      >
        <Quote content={quote} />
      </Suspense>
    </>
  );
}
