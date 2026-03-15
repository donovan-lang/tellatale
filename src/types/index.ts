export interface Profile {
  id: string;
  pen_name: string;
  avatar_url: string | null;
  bio: string | null;
  wallet_address: string | null;
  created_at: string;
}

export interface Story {
  id: string;
  parent_id: string | null;
  author_id: string | null;
  author_name: string;
  title: string;
  content: string;
  image_url: string | null;
  image_prompt: string | null;
  upvotes: number;
  downvotes: number;
  depth: number;
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
