import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://your-app.vercel.app";

// ===== CONFIGURE YOUR NFT HERE =====
const NFT_COLLECTION = "0x9b1acd279e13115742e92cda0baccb02384f4a79";
const NFT_TOKEN_ID = "4";
const CHAIN_ID = "8453";
const APP_NAME = "Collect Moment"; // Change to your app name
// ====================================

const OG_IMAGE = `https://api.inprocess.world/api/og/moment?collectionAddress=${NFT_COLLECTION}&tokenId=${NFT_TOKEN_ID}&chainId=${CHAIN_ID}`;

export const metadata: Metadata = {
  title: APP_NAME,
  openGraph: {
    title: APP_NAME,
    images: [OG_IMAGE],
    url: APP_URL,
  },
  other: {
    "fc:miniapp": JSON.stringify({
      version: "1",
      imageUrl: OG_IMAGE,
      button: {
        title: "Collect",
        action: {
          type: "launch_frame",
          name: APP_NAME,
          url: APP_URL,
          splashImageUrl: OG_IMAGE,
          splashBackgroundColor: "#e9ccbb",
        },
      },
    }),
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
