"use client";

import Page, { Props as PageProps } from "@/components/Page";
import { styled } from "@mui/system";
import { CircularProgress, Stack } from "@mui/material";

import Script from "next/script";
import { useRouter } from "next/navigation";

declare const OneTrust: {
  NoticeApi: {
    Initialized: Promise<unknown>;
    LoadNotices: (urls: unknown[]) => void;
  };
};

const OneTrustNotice = styled("div")(({ theme }) => ({
  padding: theme.spacing(5),
  a: {
    color: theme.palette.primary.main,
  },
  backgroundColor: theme.palette.background.paper,
}));

function Loader() {
  return (
    <Stack justifyContent="center" alignItems="center">
      <CircularProgress />
    </Stack>
  );
}

export default function PrivacyPolicy() {
  const router = useRouter();
  const header: PageProps["header"] = {
    navigation: {
      hierarchy: [{ label: "Privacy Policy" }],
      startButton: { label: "Indietro", onClick: () => router.back() },
    },
  };
  const onLoad = () => {
    OneTrust.NoticeApi.Initialized.then(function () {
      OneTrust.NoticeApi.LoadNotices([
        "https://privacyportalde-cdn.onetrust.com/77f17844-04c3-4969-a11d-462ee77acbe1/privacy-notices/10e53485-5d67-4f72-9daa-cceffaff290f.json",
      ]);
    });
  };
  return (
    <Page header={header} hideSidenav>
      <OneTrustNotice
        id="otnotice-10e53485-5d67-4f72-9daa-cceffaff290f"
        className="otnotice"
      >
        <Loader />
      </OneTrustNotice>
      <Script
        src="https://privacyportalde-cdn.onetrust.com/privacy-notice-scripts/otnotice-1.0.min.js"
        type="text/javascript"
        id="otprivacy-notice-script"
        onLoad={onLoad}
      />
    </Page>
  );
}
