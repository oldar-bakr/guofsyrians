import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

// Every student page requires sign-in and a completed student profile.
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    const { data: profile } = await supabase.from("profiles").select("id").eq("id", data.user.id).maybeSingle();
    if (!profile) throw redirect({ to: "/onboarding" });
  },
  component: () => <Outlet />,
});
