import ThemeRegistry from "@/app/_components/mui/ThemeRegistry";
import Header from "@/app/_components/Header";

export const metadata = {
  title: "Firma con IO",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>
          <Header />
          {children}
        </ThemeRegistry>
      </body>
    </html>
  );
}
