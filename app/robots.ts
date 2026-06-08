import type { MetadataRoute } from "next";
import { getPublicAppUrl } from "../lib/siteConfig";

export default function robots(): MetadataRoute.Robots {
  const base = getPublicAppUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/monsite", "/monsite/", "/api/"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
