import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import logo from "@/assets/union-logo.png.asset.json";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول | تطبيق خدمات الطلاب" },
      { name: "description", content: "تسجيل الدخول إلى لوحة إدارة تطبيق خدمات الطلاب." },
      { property: "og:title", content: "تسجيل الدخول" },
      { property: "og:description", content: "الدخول إلى لوحة الإدارة." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
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
      else navigate({ to: "/admin" });
    } else {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/admin` } });
      setMsg(error ? error.message : "تم إنشاء الحساب. تحقق من بريدك لتأكيد الحساب ثم سجّل الدخول.");
    }
    setBusy(false);
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) return setMsg("تعذّر الدخول عبر Google");
    if (r.redirected) return;
    navigate({ to: "/admin" });
  };

  return (
    <div className="grid min-h-screen place-items-center bg-muted px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-3xl bg-card p-8 shadow-soft">
        <img src={logo.url} alt="شعار الاتحاد" className="mx-auto h-20" />
        <h1 className="text-center font-display text-2xl font-bold">{mode === "in" ? "تسجيل الدخول" : "إنشاء حساب"}</h1>
        <button type="button" onClick={google} className="w-full rounded-xl bg-primary py-3 font-bold text-primary-foreground">الدخول عبر Google</button>
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
