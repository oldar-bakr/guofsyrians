import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CityUniversitySelect } from "@/components/CityUniversitySelect";
import logo from "@/assets/union-logo.png.asset.json";

export const Route = createFileRoute("/onboarding")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "بيانات الطالب | تطبيق خدمات الطلاب" },
      { name: "description", content: "أكمل بياناتك الطلابية لتفعيل عضويتك." },
      { property: "og:title", content: "بيانات الطالب" },
      { property: "og:description", content: "أكمل بياناتك لتفعيل العضوية." },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    const { data: p } = await supabase.from("profiles").select("id").eq("id", data.user.id).maybeSingle();
    if (p) throw redirect({ to: "/home" });
    return { fullName: (data.user.user_metadata?.["full_name"] as string) ?? "" };
  },
  component: Onboarding,
});

const fields = [
  { key: "full_name", label: "الاسم الكامل", required: true },
  { key: "phone", label: "رقم الهاتف", required: true, type: "tel" },
  { key: "faculty", label: "الكلية / التخصص", required: true },
  { key: "student_number", label: "الرقم الجامعي", required: false },
] as const;

function Onboarding() {
  const { fullName } = Route.useRouteContext();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState<Record<string, string>>({ full_name: fullName });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { data } = await supabase.auth.getUser();
    if (!data.user) return navigate({ to: "/auth" });
    const { error } = await supabase.from("profiles").insert({
      id: data.user.id,
      full_name: (form["full_name"] ?? "").trim(),
      phone: (form["phone"] ?? "").trim(),
      city: (form["city"] ?? "").trim(),
      university: (form["university"] ?? "").trim(),
      faculty: (form["faculty"] ?? "").trim(),
      student_number: (form["student_number"] ?? "").trim(),
    });
    setBusy(false);
    if (error) return setError("تعذّر حفظ البيانات، حاول مرة أخرى");
    await qc.invalidateQueries({ queryKey: ["my-profile"] });
    navigate({ to: "/home" });
  };

  return (
    <div className="grid min-h-screen place-items-center bg-muted px-4 py-8">
      <form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-3xl bg-card p-8 shadow-soft">
        <img src={logo.url} alt="شعار الاتحاد" className="mx-auto h-16" />
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold">أهلاً بك! أكمل بياناتك</h1>
          <p className="mt-1 text-sm text-muted-foreground">نحتاج بياناتك الطلابية الحقيقية لإصدار بطاقة العضوية</p>
        </div>
        <CityUniversitySelect required city={form["city"] ?? ""} university={form["university"] ?? ""} onChange={(v) => setForm({ ...form, ...v })} className="mt-1 w-full rounded-xl border bg-background px-4 py-2 disabled:opacity-60" />
        {fields.map((f) => (
          <label key={f.key} className="block text-sm">
            {f.label}{f.required && <span className="text-destructive"> *</span>}
            <input
              required={f.required}
              type={"type" in f ? f.type : "text"}
              value={form[f.key] ?? ""}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
              className="mt-1 w-full rounded-xl border bg-background px-4 py-2"
            />
          </label>
        ))}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button disabled={busy} className="w-full rounded-xl bg-primary py-3 font-bold text-primary-foreground disabled:opacity-60">حفظ ومتابعة</button>
      </form>
    </div>
  );
}
