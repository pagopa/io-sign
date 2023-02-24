import CommonHeader from "@/components/CommonHeader/CommonHeader";
import { Box, Grid } from "@mui/material";
import { JwtUser } from "@pagopa/mui-italia";

import Head from "next/head";

const loggedUserMock: JwtUser = {
  id: "thisIsAMockedUser",
};

export default function Home() {
  return (
    <>
      <Head>
        <title>Firma con IO - DevPortal</title>
        <meta
          name="description"
          content="Portale di backoffice per il prodotto Firma con IO"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.svg" />
      </Head>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}
      >
        <Box gridArea="header">
          <CommonHeader
            loggedUser={loggedUserMock}
            assistanceEmail={"firmaconio-tech@pagopa.it"}
          />
        </Box>
        <Grid container direction="row" flexGrow={1}>
          MESSAGE HERE
        </Grid>
        <Box gridArea="footer">FOOTER HERE</Box>
      </Box>
    </>
  );
}
