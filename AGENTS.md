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

- App content (news, courses, deals, events, products, branches) lives in Lovable Cloud tables with public read and admin-only write via has_role; section fields are defined once in src/lib/content.ts so app pages and /admin stay in sync.
- The first account to sign up is made admin by a database trigger; later accounts get the user role.
