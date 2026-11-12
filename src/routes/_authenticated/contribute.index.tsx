import { createFileRoute, redirect } from "@tanstack/react-router";

// Old /contribute links (and the old ?kind=... deep links) keep working.
export const Route = createFileRoute("/_authenticated/contribute/")({
  staticData: { sitemap: false },
  loader: ({ location }) => {
    const raw = typeof location.searchStr === "string" ? location.searchStr : "";
    const kind = new URLSearchParams(raw).get("kind");
    throw redirect({
      to: kind === "products" ? "/contribute/products" : "/contribute/courses",
      replace: true,
    });
  },
});
