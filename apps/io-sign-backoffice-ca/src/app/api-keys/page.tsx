import { Suspense } from "react";

import Box from "@/app/_components/mui/Box";
import Loading from "@/app/_components/Loading";

import Quote from "@/app/_components/Quote";
import { addApiKey } from "@/use-cases/add-api-key";

export default function Home() {
  const apiKey = addApiKey();
  return (
    <>
      <Suspense
        fallback={
          <Box p={2}>
            <Loading />
          </Box>
        }
      >
        <Quote content={apiKey} />
      </Suspense>
    </>
  );
}
