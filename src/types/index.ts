export interface Report {
  id: string;
  story_id: string;
  reporter_id: string;
  reason: string;
  status: "pending" | "reviewed" | "actioned" | "dismissed";
  admin_note: string | null;
  created_at: string;
  resolved_at: string | null;
  story?: Story;
}

export interface Profile {
  id: string;
  pen_name: string;
  slug: string | null;
  is_banned: boolean;
  avatar_url: string | null;
  bio: string | null;
  wallet_address: string | null;
  created_at: string;
}

export interface AuthorProfile extends Profile {
  stats: {
    total_seeds: number;
    total_branches: number;
    total_votes: number;
  };
}

export interface Story {
  id: string;
  parent_id: string | null;
  author_id: string | null;
  author_name: string;
  title: string | null;
  content: string;
  story_type: "seed" | "branch";
  is_ending: boolean;
  image_url: string | null;
  image_prompt: string | null;
  upvotes: number;
  downvotes: number;
  depth: number;
  slug: string | null;
  teaser: string | null;
  tags: string[] | null;
  is_hidden: boolean;
  hidden_reason?: string | null;
  created_at: string;
  children_count?: number;
}

export interface Vote {
  id: string;
  story_id: string;
  user_id: string;
  vote: 1 | -1;
  created_at: string;
}

export interface Donation {
  id: string;
  story_id: string;
  donor_wallet: string;
  amount_lamports: number;
  token: "USDC" | "SOL";
  tx_signature: string;
  created_at: string;
}

export interface Chronicle {
  id: string;
  user_id: string;
  root_story_id: string;
  title: string;
  story_path: string[]; // uuid[]
  created_at: string;
  updated_at: string;
  root_story?: Story;
}

export interface ReadingProgress {
  user_id: string;
  root_story_id: string;
  current_story_id: string;
  updated_at: string;
  root_story?: Story;
  current_story?: Story;
}

export interface Bookmark {
  id: string;
  user_id: string;
  story_id: string;
  root_story_id: string;
  note: string | null;
  created_at: string;
  story?: Story;
  root_story?: Story;
}
