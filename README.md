# Make A Tale

## Overview

Make A Tale is a Node.js-powered storytelling platform built with Next.js and Supabase. Create, share, and explore interactive narrative experiences with a branching story system and community reactions.

## Setup

1. Clone the repository
2. Copy `.env.local.example` to `.env.local` and configure your Supabase credentials
3. Install dependencies: `npm install`
4. Seed the database: `python seed-full.py` (or individual seed scripts as needed)
5. Run the development server: `npm run dev`
6. Open http://localhost:3000

## Tech Stack

- **Frontend**: Next.js, React, PostCSS
- **Backend**: Node.js, Supabase (PostgreSQL)
- **Database**: PostgreSQL (via Supabase)
- **Deployment**: Vercel
- **Utilities**: Python (data seeding and migrations)