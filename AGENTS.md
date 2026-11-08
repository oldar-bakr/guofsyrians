<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Subscription demonstrations are isolated client-side simulations in subscription-demo.ts; never use their results to charge money, update membership, or authorize services, because only verified provider payments can grant paid access.

- App content (news, courses, deals, events, products, branches) lives in Lovable Cloud tables with public read and write limited to admin or editor roles (can_edit_content); user management goes through admin-checked server functions in src/lib/users.functions.ts; section fields are defined once in src/lib/content.ts so app pages and /admin stay in sync.
- A database trigger makes the owner email admin on signup and everyone else a student; the owner account is protected from demotion/blocking/deletion in users.functions.ts.
- Student activity (enrollments, event registrations, deal redemptions, orders, assistant Q&A) is stored per user (own rows + staff read via can_edit_content) and shown in /admin "نشاط الطلاب"; the assistant answers only from DB content via src/lib/assistant.functions.ts.
- Student pages live under src/routes/_authenticated (client-only gate: signed in + profiles row, else /auth or /onboarding).
- City detection from a map position resolves against bundled province outlines in src/data/turkey-provinces.json via src/lib/province-shapes.ts, so it needs no external API key; the Google Maps connector is used only when its secrets happen to be present.
- Student avatar photos are uploaded to the private "avatars" storage bucket under a folder named after the user id, and profiles.avatar_url stores that path (never a public URL), so every view resolves a short-lived signed link through src/lib/avatar.ts; public buckets are blocked in this workspace, so do not switch the bucket to public.
- Businesses (table businesses, one per owner, status pending/approved/rejected set only by staff via trigger) publish their own deals (deals.business_id); student QR scans are verified and recorded into deal_redemptions only through admin-backed server functions in src/lib/business.functions.ts, and membership activation (profiles.membership_active/expires) is admin-only via trigger + setMembership; business logos live in the private "business-logos" bucket.
