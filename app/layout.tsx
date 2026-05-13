import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://your-app.vercel.app";
const NFT_COLLECTION = "0x3a005d81ec81f9f48f973c433206ca7ef907721a";
const NFT_TOKEN_ID = "4";
const CHAIN_ID = "8453";
const APP_NAME = "xaeuzinha";

const OG_IMAGE = `https://api.inprocess.world/api/og/moment?collectionAddress=${NFT_COLLECTION}&tokenId=${NFT_TOKEN_ID}&chainId=${CHAIN_ID}`;

const miniappMeta = {
  version: "1",
  imageUrl: OG_IMAGE,
  button: {
    title: "Mint",
    action: {
      type: "launch_frame",
      name: APP_NAME,
      url: APP_URL,
      splashImageUrl: OG_IMAGE,
      splashBackgroundColor: "#e05a4e",
    },
  },
};

export const metadata: Metadata = {
  title: APP_NAME,
  openGraph: {
    title: APP_NAME,
    images: [OG_IMAGE],
    url: APP_URL,
  },
  other: {
    "fc:miniapp": JSON.stringify(miniappMeta),
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Viewport essencial para iOS — evita zoom e resize ao abrir teclado */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, interactive-widget=resizes-content"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Mouse+Memoirs&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
