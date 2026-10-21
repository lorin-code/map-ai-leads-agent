import type { Metadata } from "next";

const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export const siteUrl = rawSiteUrl ? new URL(rawSiteUrl) : undefined;

const siteName = "AI 线索助手";

type PageSeo = {
  title: string;
  description: string;
  path: string;
  noIndex?: boolean;
};

export function createPageMetadata({ title, description, path, noIndex }: PageSeo): Metadata {
  const canonicalPath = path.startsWith("/") ? path : `/${path}`;
  const absoluteUrl = siteUrl ? new URL(canonicalPath, siteUrl).toString() : undefined;

  return {
    title,
    description,
    ...(absoluteUrl
      ? {
          alternates: {
            canonical: absoluteUrl,
          },
        }
      : {}),
    openGraph: {
      title,
      description,
      siteName,
      locale: "zh_CN",
      type: "website",
      ...(absoluteUrl ? { url: absoluteUrl } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
          },
        }
      : {
          index: true,
          follow: true,
        },
  };
}
