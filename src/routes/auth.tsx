import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import logo from "@/assets/union-logo.png.asset.json";

export const Route = createFileRoute("/auth")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "تسجيل الدخول | تطبيق خدمات الطلاب" },
      { name: "description", content: "سجّل دخولك إلى تطبيق خدمات الطلاب." },
      { property: "og:title", content: "تسجيل الدخول" },
      { property: "og:description", content: "سجّل دخولك إلى تطبيق خدمات الطلاب." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { as?: "business" } => (s["as"] === "business" ? { as: "business" } : {}),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { as } = Route.useSearch();
  const isBiz = as === "business";
  const target = isBiz ? "/business" : "/home";
  useEffect(() => {
    if (!isBiz) return;
    supabase.auth.getUser().then(({ data }) => { if (data.user) navigate({ to: "/business", replace: true }); });
  }, [isBiz, navigate]);
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg("البريد أو كلمة المرور غير صحيحة");
      else navigate({ to: target });
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: isBiz ? `${window.location.origin}/auth?as=business` : window.location.origin } });
      if (error) setMsg(error.message);
      else if (data.session) navigate({ to: target });
      else {
        const r = await supabase.auth.signInWithPassword({ email, password });
        if (r.error) setMsg(r.error.message); else navigate({ to: target });
      }
    }
    setBusy(false);
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: isBiz ? `${window.location.origin}/auth?as=business` : window.location.origin });
    if (r.error) return setMsg("تعذّر الدخول عبر Google");
    if (r.redirected) return;
    navigate({ to: target });
  };

  return (
    <div className="grid min-h-screen place-items-center bg-muted px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-3xl bg-card p-8 shadow-soft">
        <img src={logo.url} alt="شعار الاتحاد" className="mx-auto h-20" />
        <h1 className="text-center font-display text-2xl font-bold">{mode === "in" ? "تسجيل الدخول" : "إنشاء حساب"}</h1>
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1 text-sm">
          <button type="button" onClick={() => navigate({ to: "/auth", search: {} })} className={`rounded-lg py-2 ${!isBiz ? "bg-card font-bold shadow-soft" : ""}`}>طالب</button>
          <button type="button" onClick={() => navigate({ to: "/auth", search: { as: "business" } })} className={`rounded-lg py-2 ${isBiz ? "bg-card font-bold shadow-soft" : ""}`}>صاحب عمل</button>
        </div>
        {isBiz && <p className="text-center text-xs text-muted-foreground">للمطاعم والمقاهي والمتاجر وشركات الخدمات التي تقدّم تخفيضات للطلاب</p>}
        <GoogleSignInButton onClick={google} disabled={busy} />
        <p className="text-center text-xs text-muted-foreground">أو باستخدام البريد الإلكتروني</p>
        <input type="email" required placeholder="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border bg-background px-4 py-2" />
        <input type="password" required minLength={6} placeholder="كلمة المرور" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border bg-background px-4 py-2" />
        <button disabled={busy} className="w-full rounded-xl border py-2 font-bold disabled:opacity-60">{mode === "in" ? "دخول" : "إنشاء الحساب"}</button>
        {msg && <p className="text-center text-sm text-muted-foreground">{msg}</p>}
        <button type="button" onClick={() => setMode(mode === "in" ? "up" : "in")} className="w-full text-sm text-primary">
          {mode === "in" ? "ليس لديك حساب؟ أنشئ حساباً" : "لديك حساب؟ سجّل الدخول"}
        </button>
      </form>
    </div>
  );
}
