export const dynamic = "force-dynamic";

import { createServiceClient } from "@/lib/supabase-server";
import { toAuthorSlug } from "@/lib/utils";
import type { Story } from "@/types";
import SimilarWriters from "@/components/SimilarWriters";
import ProfileView from "@/components/profile/ProfileView";
import { resolveTheme, type ProfileCustomization } from "@/lib/profile-theme";
import { computeStats, genreBreakdown, splitStories, type ProfileAuthor } from "@/lib/profile-data";

interface AuthorData {
  author: ProfileAuthor;
  customization: ProfileCustomization | null;
}

async function getAuthorBySlug(slug: string): Promise<AuthorData | null> {
  try {
    const supabase = createServiceClient();

    // 1. Try registered profile first
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("slug", slug)
      .single();

    if (profile) {
      const { data: stories } = await supabase
        .from("stories")
        .select("*")
        .eq("author_id", profile.id)
        .eq("is_hidden", false)
        .order("created_at", { ascending: false });

      return {
        author: {
          profileId: profile.id,
          slug,
          name: profile.pen_name,
          bio: profile.bio,
          avatarUrl: profile.avatar_url ?? null,
          walletAddress: profile.wallet_address,
          joined: profile.created_at,
          // customization/pinned_story_id are absent until the 20261016 migration runs
          pinnedStoryId: profile.pinned_story_id ?? null,
          ...splitStories((stories || []) as Story[]),
        },
        customization: profile.customization ?? null,
      };
    }

    // 2. No profile — find stories by author_name matching the slug
    const { data: allStories } = await supabase
      .from("stories")
      .select("*")
      .eq("is_hidden", false)
      .order("created_at", { ascending: false });

    const authorStories = ((allStories || []) as Story[]).filter(
      (s) => toAuthorSlug(s.author_name) === slug
    );
    if (authorStories.length === 0) return null;

    return {
      author: {
        profileId: null,
        slug,
        name: authorStories[0].author_name,
        bio: null,
        avatarUrl: null,
        walletAddress: null,
        joined: authorStories[authorStories.length - 1]?.created_at ?? null,
        pinnedStoryId: null,
        ...splitStories(authorStories),
      },
      customization: null,
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { name: string };
}) {
  const data = await getAuthorBySlug(params.name);
  if (!data) return { title: "Author Not Found — MakeATale" };
  const { author } = data;
  const stats = computeStats(author);
  const canonical = `https://makeatale.com/author/${params.name}`;
  const desc = author.bio
    ? author.bio.slice(0, 160)
    : `Read ${stats.seeds} story seeds and ${stats.branches} branches by ${author.name} on MakeATale — collaborative AI storytelling.`;
  return {
    title: `${author.name} — Stories on MakeATale`,
    description: desc,
    alternates: { canonical },
    openGraph: {
      title: `${author.name} on MakeATale`,
      description: desc,
      url: canonical,
      type: "profile",
      images: [{ url: "https://makeatale.com/logos/og-default.png" }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${author.name} on MakeATale`,
      description: desc,
    },
  };
}

export default async function AuthorPage({
  params,
}: {
  params: { name: string };
}) {
  const data = await getAuthorBySlug(params.name);

  if (!data) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-gray-400">Author not found</h1>
        <p className="mt-2 text-gray-600">
          No stories found for this author.
        </p>
        <a href="/stories" className="btn-primary mt-4 inline-block">
          Explore stories
        </a>
      </div>
    );
  }

  const { author, customization } = data;
  const stats = computeStats(author);
  const genres = genreBreakdown(author.allStories);

  // ── Schema.org Person + BreadcrumbList JSON-LD for SEO ──
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: author.name,
    description: author.bio || `Author on MakeATale with ${stats.seeds} seeds and ${stats.branches} branches.`,
    url: `https://makeatale.com/author/${params.name}`,
    sameAs: [],
    knowsAbout: genres.slice(0, 5).map((g) => g.genre),
    mainEntityOfPage: {
      "@type": "ProfilePage",
      "@id": `https://makeatale.com/author/${params.name}`,
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://makeatale.com" },
      { "@type": "ListItem", position: 2, name: "Stories", item: "https://makeatale.com/stories" },
      { "@type": "ListItem", position: 3, name: author.name, item: `https://makeatale.com/author/${params.name}` },
    ],
  };

  const firstTag = author.seeds[0]?.tags?.[0];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <ProfileView author={author} theme={resolveTheme(customization)}>
        {firstTag && <SimilarWriters tag={firstTag} currentAuthor={author.name} themed />}
      </ProfileView>
    </>
  );
}
