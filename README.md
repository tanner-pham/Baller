## Idea
Baller is a web based tool that helps users make smarter and safer purchasing decisions on peer-to-peer marketplaces. 

Utilizing machine learning models and market trends, Baller cross-references and creates a offer grounded in real life data. 
## Goals
##### Major Features
- Condition tagging from product images and descriptions
- Grabbing data from FB Marketplace listing
- Consolodating data in readable dashboard
- Optimal price recommendation from generalized product description

##### Anticipated Features
- Price trend visualization and timing insights
- Scam and risk detection from reviews and online data
- Personalized learning and feedback loop

## Living Document Link
 Our [Baller Living Document](https://docs.google.com/document/d/1Ne9dMbzxdo1actxRgpeopU2VFmHr2Dr3ZVr-e0mSXKc/edit?usp=sharing) is a one-stop shop for more insight into the development process! Check it out for more information. 

## Getting Started

(Instructions for deployment, to come as architecture is finalized)

## Supabase Auth Setup

1. Copy `.env.example` to `.env.local`.
2. Fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only)
3. In Supabase dashboard:
   - `Auth > Providers`: enable Email provider.
   - `Auth > Email`: keep email confirmations disabled for now.
   - `Auth > URL Configuration`: set `Site URL` to `http://localhost:3000` for local dev.

Auth flow in the app:
- `/auth` supports email/password sign up and login.
- Successful auth redirects to `/dashboard`.
- `/dashboard` requires an active session and redirects to `/auth` when signed out.
