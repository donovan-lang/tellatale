import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Writing Challenges | MakeATale",
  description:
    "Join active writing challenges on MakeATale. Compete with other writers, get featured, and shape the next round of collaborative AI stories.",
  keywords: [
    "writing challenges",
    "writing contests",
    "writing prompts",
    "AI writing competition",
    "collaborative fiction contest",
    "MakeATale",
  ],
  alternates: { canonical: "https://makeatale.com/challenges" },
  openGraph: {
    title: "Writing Challenges on MakeATale",
    description:
      "Compete in writing challenges on MakeATale. Top-voted entries get featured across the platform.",
    url: "https://makeatale.com/challenges",
    siteName: "MakeATale",
    type: "website",
    images: [{ url: "https://makeatale.com/logos/og-default.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Writing Challenges | MakeATale",
    description:
      "Join active writing challenges. Compete with other writers and get featured.",
  },
};

const challengesSchema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Writing Challenges",
  description:
    "Active and past writing challenges on MakeATale — collaborative AI storytelling competitions.",
  url: "https://makeatale.com/challenges",
  isPartOf: {
    "@type": "WebSite",
    name: "MakeATale",
    url: "https://makeatale.com",
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://makeatale.com" },
    { "@type": "ListItem", position: 2, name: "Challenges", item: "https://makeatale.com/challenges" },
  ],
};

export default function ChallengesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(challengesSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  );
}
