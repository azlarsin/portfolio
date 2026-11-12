import type { Metadata } from "next";
import "./globals.css";

const title = "Layered Route Lab — URL-driven presenter reconstruction";
const description =
  "A backend-free, sanitized demonstration of layered routes, presenters, modal history and 3D stack debugging.";
const localSiteUrl = "http://localhost:3000";

function resolveMetadataBase() {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const allowLocalDemoUrl = process.env.ALLOW_LOCAL_DEMO_URL === "1";
  const validatesProductionConfig = process.env.NODE_ENV === "production";

  if (!configuredSiteUrl) {
    if (validatesProductionConfig && !allowLocalDemoUrl) {
      throw new Error(
        "NEXT_PUBLIC_SITE_URL is required for production builds. " +
          "Set the deployed public origin, or use ALLOW_LOCAL_DEMO_URL=1 " +
          "only for an explicit local build.",
      );
    }
    return new URL(localSiteUrl);
  }

  let siteUrl: URL;
  try {
    siteUrl = new URL(configuredSiteUrl);
  } catch {
    throw new Error("NEXT_PUBLIC_SITE_URL must be an absolute http(s) URL.");
  }

  if (siteUrl.protocol !== "http:" && siteUrl.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_SITE_URL must use http or https.");
  }

  const isLocalSite = ["localhost", "127.0.0.1", "[::1]"].includes(
    siteUrl.hostname,
  );
  if (validatesProductionConfig && isLocalSite && !allowLocalDemoUrl) {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL cannot use localhost for a production build. " +
        "Set the deployed public origin, or use ALLOW_LOCAL_DEMO_URL=1 " +
        "only for an explicit local build.",
    );
  }

  return siteUrl;
}

const metadataBase = resolveMetadataBase();

export const metadata: Metadata = {
  metadataBase,
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1731,
        height: 909,
        alt: "Five presenter surfaces stacked in the Layered Route Lab",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
