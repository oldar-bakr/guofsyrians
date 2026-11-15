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
- Scholarships use the shared content section registry and staff-managed Cloud records so the home service and dashboard stay in sync.
- Content images store private bucket paths with owner/staff-only direct reads; a server function checks caller-visible content through RLS before signing images for other viewers. Uploads preserve transparency; news slider covers fill the frame while detail galleries preserve full aspect ratio.
- The home news slider uses the existing Embla carousel with RTL navigation and private signed cover images; motion pauses during interaction and respects reduced-motion preferences.
- Course quiz answer keys are staff-only records; authenticated server functions verify enrollment and course visibility before returning sanitized questions or saving server-graded attempts, preventing client-forged scores.
- The university directory is a bundled domestic YÖK catalogue enriched with sourced institutional office emails; staff-managed branch contacts override demo representatives, which remain explicitly labelled as fictional.
- Deal cards link to student-facing partner profiles; the shared redemption dialog preserves the same QR payload and is separate from card navigation, including legacy staff-created offers without a business row.
- Deal filtering uses shared pure predicates with normalized city matching and business IDs (legacy partner names only when unlinked); company options depend on the selected city to avoid unrelated selections.
- Assistant answers render through a shared safe Markdown view with GFM/email links and phone linkification; raw HTML, remote images, and unsafe URL schemes are disabled to keep model output untrusted.
