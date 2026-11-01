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

- App content (news, courses, deals, events, products, branches) lives in Lovable Cloud tables with public read and write limited to admin or editor roles (can_edit_content); user management goes through admin-checked server functions in src/lib/users.functions.ts; section fields are defined once in src/lib/content.ts so app pages and /admin stay in sync.
- A database trigger makes the owner email admin on signup and everyone else a student; the owner account is protected from demotion/blocking/deletion in users.functions.ts.
- Student pages live under src/routes/_authenticated (client-only gate: signed in + profiles row, else /auth or /onboarding).
