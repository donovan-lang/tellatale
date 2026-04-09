import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/api/openapi", "/api/v1/stories", "/embed/", "/embed.js"],
      disallow: ["/api/ai-assist", "/api/generate-tale", "/api/stories", "/admin/"],
    },
    sitemap: [
      "https://makeatale.com/sitemap.xml",
      "https://makeatale.com/sitemap-index.xml",
    ],
  };
}
