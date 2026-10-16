// A writer's themed profile. No hooks or event handlers, so the /author page can server-render it
// and the profile editor can render the same thing as a live preview.
import type { CSSProperties, ReactNode } from "react";
import { format } from "date-fns";
import { ChevronUp, Feather, Calendar, Wallet } from "lucide-react";
import FollowButton from "@/components/FollowButton";
import DonateButton from "@/components/DonateButton";
import AchievementBadges from "@/components/AchievementBadges";
import {
  LIVE_BLOCKS,
  fontStylesheetUrl,
  themeToCssVars,
  toRoman,
  type BlockId,
  type ResolvedTheme,
} from "@/lib/profile-theme";
import {
  computeChapters,
  computeStats,
  featuredStory,
  genreBreakdown,
  type ProfileAuthor,
} from "@/lib/profile-data";
import type { Story } from "@/types";

interface Props {
  author: ProfileAuthor;
  theme: ResolvedTheme;
  /** Editor preview: hide buttons that act on the account. */
  preview?: boolean;
  /** Extra content rendered inside the themed page, after the blocks. */
  children?: ReactNode;
}

const net = (s: Story) => (s.upvotes || 0) - (s.downvotes || 0);
const href = (s: Story) => `/story/${s.slug || s.id}`;
const excerpt = (text: string, max: number) => {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max).replace(/\s\S*$/, "")}…` : flat;
};

export default function ProfileView({ author, theme, preview = false, children }: Props) {
  const vars = themeToCssVars(theme) as CSSProperties;
  const blocks = theme.layout.filter((l) => l.visible && LIVE_BLOCKS.includes(l.block)).map((l) => l.block);

  return (
    <div className="profile-root min-h-full" style={vars} data-effect={theme.effect}>
      <link rel="stylesheet" href={fontStylesheetUrl(theme.font)} />
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <Header author={author} theme={theme} preview={preview} />
        {blocks.map((b) => (
          <Block key={b} id={b} author={author} theme={theme} preview={preview} />
        ))}
        {author.allStories.length === 0 && (
          <p className="profile-panel p-8 text-center profile-muted">
            {author.name} hasn&apos;t written any stories yet. Their first chapter starts with a seed.
          </p>
        )}
        {children}
      </div>
    </div>
  );
}

function Block({ id, ...rest }: { id: BlockId } & Props) {
  switch (id) {
    case "featured":
      return <Featured {...rest} />;
    case "chapters":
      return <Chapters {...rest} />;
    case "stats":
      return <Stats {...rest} />;
    case "badges":
      return <Badges {...rest} />;
    case "stories":
      return <Stories {...rest} />;
    default:
      return null;
  }
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="profile-heading text-2xl sm:text-3xl mb-4">{children}</h2>;
}

function Header({ author, theme, preview }: Props) {
  const avatar = author.avatarUrl?.startsWith("https://") ? author.avatarUrl : null;
  return (
    <header className="profile-panel overflow-hidden">
      <div className="profile-banner h-36 sm:h-52" aria-hidden />
      <div className="px-5 sm:px-8 pb-7">
        <div className="-mt-14 sm:-mt-16 flex flex-wrap items-end gap-4">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="" className="profile-avatar w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover" />
          ) : (
            <div className="profile-avatar w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center text-5xl" aria-hidden>
              {author.name.charAt(0).toUpperCase()}
            </div>
          )}
          {theme.status && (
            <p className="profile-status px-4 py-2 text-sm mb-2 flex items-center gap-2 max-w-full">
              <Feather size={14} className="shrink-0" style={{ color: "var(--p-accent)" }} aria-hidden />
              <span className="truncate">{theme.status}</span>
            </p>
          )}
        </div>

        <h1 className="profile-heading mt-4 text-[clamp(2.5rem,8vw,4.75rem)] break-words">{author.name}</h1>
        {author.bio && <p className="mt-3 max-w-[62ch] text-lg leading-relaxed">{author.bio}</p>}

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm profile-muted">
          {author.joined && (
            <span className="flex items-center gap-1.5">
              <Calendar size={14} aria-hidden />
              Writing here since {format(new Date(author.joined), "MMMM yyyy")}
            </span>
          )}
          {author.walletAddress && (
            <span className="flex items-center gap-1.5">
              <Wallet size={14} aria-hidden />
              Accepts tips
            </span>
          )}
          {!preview && author.profileId && <FollowButton authorId={author.profileId} />}
        </div>
      </div>
    </header>
  );
}

function Featured({ author, preview }: Props) {
  const f = featuredStory(author);
  if (!f) return null;
  const { story } = f;
  return (
    <section className="profile-panel p-6 sm:p-8" style={{ borderLeft: "6px solid var(--p-accent)" }}>
      <p className="text-sm profile-muted mb-2">{f.pinned ? "Pinned by " + author.name : "Most-loved tale"}</p>
      <h2 className="profile-heading text-3xl sm:text-5xl">{story.title || "Untitled"}</h2>
      <p className="mt-4 max-w-[65ch] text-lg leading-relaxed">{excerpt(story.content, 320)}</p>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <a href={href(story)} className="profile-btn px-5 py-2.5 text-sm">Start reading</a>
        <span className="flex items-center gap-1 text-sm profile-muted">
          <ChevronUp size={16} aria-hidden />
          {net(story)} votes
        </span>
        {(story.tags || []).slice(0, 3).map((t) => (
          <span key={t} className="profile-chip px-3 py-1 text-xs">{t}</span>
        ))}
        {!preview && author.walletAddress && <DonateButton storyId={story.id} />}
      </div>
    </section>
  );
}

function Chapters({ author, theme }: Props) {
  const chapters = computeChapters(author, theme.status);
  return (
    <section>
      <SectionTitle>Chapters</SectionTitle>
      <ol className="profile-chapters ml-5 space-y-6">
        {chapters.map((c, i) => (
          <li key={`${c.title}-${i}`} className="relative pl-9">
            <span className="profile-chapter-num absolute -left-[19px] top-0 w-9 h-9 rounded-full flex items-center justify-center text-sm" style={{ border: "2px solid var(--p-accent)" }}>
              {toRoman(i + 1)}
            </span>
            <h3 className="profile-heading text-xl sm:text-2xl">
              {c.href ? <a href={c.href}>{c.title}</a> : c.title}
            </h3>
            {c.date && <p className="text-sm profile-muted">{format(new Date(c.date), "MMMM d, yyyy")}</p>}
            <p className="mt-1 max-w-[62ch] leading-relaxed">{c.detail}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Stats({ author }: Props) {
  const s = computeStats(author);
  const genres = genreBreakdown(author.allStories).slice(0, 6);
  const max = genres[0]?.count || 1;
  const figures: [number, string][] = [
    [s.seeds, s.seeds === 1 ? "seed planted" : "seeds planted"],
    [s.branches, s.branches === 1 ? "branch written" : "branches written"],
    [s.endings, s.endings === 1 ? "ending" : "endings"],
    [s.votes, s.votes === 1 ? "vote earned" : "votes earned"],
  ];
  return (
    <section className="profile-panel p-6 sm:p-8">
      <SectionTitle>By the numbers</SectionTitle>
      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        {figures.map(([n, label]) => (
          <div key={label}>
            <dt className="sr-only">{label}</dt>
            <dd className="profile-heading text-4xl sm:text-5xl" style={{ color: "var(--p-accent)" }}>{n}</dd>
            <dd className="text-sm profile-muted mt-1">{label}</dd>
          </div>
        ))}
      </dl>
      {genres.length > 0 && (
        <div className="mt-7 space-y-2.5">
          <h3 className="font-semibold">Genres they write</h3>
          {genres.map(({ genre, count }) => (
            <div key={genre} className="flex items-center gap-3 text-sm">
              <span className="w-28 shrink-0 truncate">{genre}</span>
              <span className="profile-bar flex-1 h-2.5"><span style={{ width: `${(count / max) * 100}%` }} /></span>
              <span className="w-8 text-right tabular-nums profile-muted">{count}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Badges({ author }: Props) {
  return (
    <section>
      <SectionTitle>Badges</SectionTitle>
      <AchievementBadges stats={computeStats(author)} themed />
    </section>
  );
}

function Stories({ author }: Props) {
  const branches = author.contributions.slice(0, 20);
  return (
    <section className="space-y-8">
      {author.seeds.length > 0 && (
        <div>
          <SectionTitle>Seeds</SectionTitle>
          <ul className="profile-panel overflow-hidden">
            {author.seeds.map((s, i) => (
              <li key={s.id} className={i ? "profile-row" : ""}>
                <a href={href(s)} className="flex items-start gap-4 px-5 py-4" style={{ color: "var(--p-text)" }}>
                  <span className="flex-1 min-w-0">
                    <span className="profile-heading block text-xl">{s.title || "Untitled"}</span>
                    <span className="block text-sm profile-muted mt-1 line-clamp-2">{excerpt(s.content, 160)}</span>
                  </span>
                  <span className="flex items-center gap-0.5 text-sm profile-muted shrink-0">
                    <ChevronUp size={15} aria-hidden />
                    {net(s)}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {branches.length > 0 && (
        <div>
          <SectionTitle>Branches</SectionTitle>
          <ul className="profile-panel overflow-hidden">
            {branches.map((s, i) => (
              <li key={s.id} className={i ? "profile-row" : ""}>
                <a href={href(s)} className="flex items-start gap-4 px-5 py-3.5" style={{ color: "var(--p-text)" }}>
                  <span className="flex-1 min-w-0 line-clamp-2">{s.teaser || excerpt(s.content, 140)}</span>
                  <span className="text-sm profile-muted shrink-0">{s.is_ending ? "Ending" : `${s.depth} deep`}</span>
                </a>
              </li>
            ))}
          </ul>
          {author.contributions.length > branches.length && (
            <p className="mt-3 text-sm profile-muted">And {author.contributions.length - branches.length} more branches.</p>
          )}
        </div>
      )}
    </section>
  );
}

