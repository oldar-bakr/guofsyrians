import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowUpLeft, Check, Copy, GraduationCap, MapPin, Plus, RotateCcw, Send, Sparkles, Tag, CalendarDays } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useContent } from "@/lib/content";
import { askAssistant } from "@/lib/assistant.functions";
import { useStudent } from "@/lib/profile";
import logo from "@/assets/union-logo.png.asset.json";

export const Route = createFileRoute("/_authenticated/assistant")({
  head: () => ({
    meta: [
      { title: "المساعد الذكي | تطبيق خدمات الطلاب" },
      { name: "description", content: "مساعد ذكي يجيب عن أسئلة الطلاب حول الدراسة والخدمات والاتحاد." },
      { property: "og:title", content: "المساعد الذكي للطالب" },
      { property: "og:description", content: "اسأل عن الدراسة والخدمات." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Assistant,
});

type Msg = { from: "me" | "bot"; text: string; error?: boolean; question?: string };

function Assistant() {
  const ask = useServerFn(askAssistant);
  const student = useStudent();
  const { data: faqs = [] } = useContent<{ id: string; question: string }>("faqs");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const [copyError, setCopyError] = useState(false);
  const inFlight = useRef(false);
  const bottom = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "instant", block: "end" });
  }, [msgs, busy]);

  useEffect(() => () => { if (copyTimer.current) clearTimeout(copyTimer.current); }, []);

  const suggestions = [
    { title: "دورة جديدة، مهارة جديدة", label: "الدورات", icon: GraduationCap, question: "ما الدورات المتاحة حالياً؟" },
    { title: "تخفيضات في مدينتك", label: "التخفيضات", icon: Tag, question: `ما التخفيضات المتاحة${student.city ? ` في ${student.city}` : ""}؟` },
    { title: "ما الفعالية القادمة؟", label: "الفعاليات", icon: CalendarDays, question: "ما الفعاليات القادمة ومواعيدها؟" },
    { title: "تواصل مع فرع الاتحاد", label: "الفروع", icon: MapPin, question: `كيف أتواصل مع فرع الاتحاد${student.university ? ` في ${student.university}` : ""}؟` },
  ];

  const send = async (q: string) => {
    const question = q.trim();
    if (!question || inFlight.current) return;
    inFlight.current = true;
    const history = msgs.filter((m) => !m.error).map(({ from, text }) => ({ from, text }));
    setMsgs((m) => [...m, { from: "me", text: question }]);
    setText("");
    setBusy(true);
    try {
      const r = await ask({ data: { question, history } });
      setMsgs((m) => [...m, { from: "bot", text: r.answer }]);
    } catch (e) {
      setMsgs((m) => [...m, { from: "bot", text: e instanceof Error ? e.message : "تعذّر الحصول على إجابة الآن", error: true, question }]);
    } finally {
      setBusy(false);
      inFlight.current = false;
      input.current?.focus({ preventScroll: true });
    }
  };

  const copy = async (value: string, index: number) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyError(false);
      setCopied(index);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(null), 2000);
    } catch { setCopyError(true); }
  };

  return (
    <AppShell title="المساعد الذكي">
      <section className="flex h-[calc(100dvh-11rem)] min-h-[440px] flex-col md:h-[calc(100dvh-8rem)]" aria-label="المساعد الذكي">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b pb-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground"><Sparkles className="size-5" /></div>
            <div><h1 className="font-display text-lg font-bold">المساعد الذكي</h1><p className="text-xs text-muted-foreground">الاتحاد العام لطلبة سوريا</p></div>
          </div>
          <Button variant="ghost" size="sm" disabled={busy || msgs.length === 0} onClick={() => { setMsgs([]); setCopied(null); setCopyError(false); input.current?.focus(); }} title="محادثة جديدة" aria-label="محادثة جديدة" className="shrink-0 text-muted-foreground"><Plus /><span className="hidden sm:inline">محادثة جديدة</span></Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-6" role="log" aria-label="المحادثة" aria-live="polite" aria-relevant="additions" aria-busy={busy}>
          {msgs.length === 0 ? (
            <div className="mx-auto flex min-h-full max-w-2xl flex-col justify-center px-1 py-3">
              <div className="mb-7 text-center">
                <img src={logo.url} alt="شعار الاتحاد" className="mx-auto mb-5 size-20 object-contain" />
                <p className="mb-2 text-sm text-muted-foreground">أهلاً{student.name ? `، ${student.name.split(" ")[0]}` : " بك"}</p>
                <h2 className="font-display text-2xl font-bold text-primary sm:text-3xl">كيف أقدر أساعدك اليوم؟</h2>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {suggestions.map(({ title, label, icon: Icon, question }, i) => (
                  <Button key={label} variant="outline" onClick={() => void send(question)} className="group h-auto min-h-24 justify-start gap-3 whitespace-normal rounded-lg bg-card p-4 text-start shadow-none hover:bg-secondary">
                    <span className={`grid size-10 shrink-0 place-items-center rounded-lg ${i % 2 === 0 ? "bg-secondary text-primary" : "bg-accent/20 text-accent-foreground"}`}><Icon className="size-5" /></span>
                    <span className="min-w-0 flex-1"><span className="mb-1 block text-xs text-muted-foreground">{label}</span><span className="block text-sm font-bold">{title}</span></span>
                    <ArrowUpLeft className="text-muted-foreground transition-transform group-hover:-translate-x-0.5 motion-reduce:transform-none" />
                  </Button>
                ))}
              </div>
              {faqs.length > 0 && <div className="mt-6"><p className="mb-2 text-center text-xs text-muted-foreground">أسئلة شائعة</p><div className="flex flex-wrap justify-center gap-2">{faqs.slice(0, 3).map((f) => <Button key={f.id} variant="ghost" size="sm" onClick={() => void send(f.question)} className="h-auto max-w-full whitespace-normal border py-2 text-start text-xs text-muted-foreground">{f.question}</Button>)}</div></div>}
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-6 px-1">
              {msgs.map((m, i) => (
                <div key={i} className={`flex items-start gap-3 ${m.from === "me" ? "flex-row-reverse" : ""}`}>
                  {m.from === "me" ? <Avatar path={student.avatar} name={student.name} university={student.university} className="size-8" textClass="text-xs" /> : <img src={logo.url} alt="المساعد" className="size-8 shrink-0 object-contain" />}
                  <div className={`min-w-0 max-w-[85%] ${m.from === "me" ? "text-end" : ""}`}>
                    <p className="mb-1.5 text-xs text-muted-foreground">{m.from === "me" ? "أنت" : "مساعد الاتحاد"}</p>
                    <div className={`whitespace-pre-wrap break-words rounded-lg px-4 py-3 text-start text-sm leading-7 ${m.from === "me" ? "bg-primary text-primary-foreground" : m.error ? "border border-destructive/25 bg-destructive/5 text-destructive" : "bg-card"}`}>{m.text}</div>
                    {m.from === "bot" && <div className="mt-1 flex items-center gap-1">{m.error ? <Button size="sm" variant="ghost" disabled={busy} onClick={() => { if (m.question) void send(m.question); }} className="text-xs text-muted-foreground"><RotateCcw />حاول مجدداً</Button> : <Button variant="ghost" size="icon" aria-label={copied === i ? "تم نسخ الإجابة" : "نسخ الإجابة"} title={copied === i ? "تم نسخ الإجابة" : "نسخ الإجابة"} onClick={() => void copy(m.text, i)} className="size-8 text-muted-foreground">{copied === i ? <Check /> : <Copy />}</Button>}</div>}
                  </div>
                </div>
              ))}
              {busy && <div className="flex items-center gap-3" role="status"><img src={logo.url} alt="" className="size-8 object-contain" /><div className="flex items-center gap-3 rounded-lg bg-card px-4 py-3"><span className="flex gap-1" aria-hidden="true">{[0, 1, 2].map((i) => <span key={i} className="size-1.5 rounded-full bg-primary/60 motion-safe:animate-pulse" />)}</span><span className="text-xs text-muted-foreground">يحضّر إجابتك...</span></div></div>}
            </div>
          )}
          <div ref={bottom} />
        </div>

        <div className="shrink-0 pt-3">
          <form onSubmit={(e) => { e.preventDefault(); void send(text); }} className="mx-auto flex max-w-3xl items-end gap-3 rounded-lg border bg-card p-2 shadow-soft focus-within:border-ring focus-within:ring-1 focus-within:ring-ring">
            <Textarea ref={input} value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} rows={2} aria-label="سؤالك للمساعد" placeholder="اكتب سؤالك هنا..." onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void send(text); } }} className="max-h-36 min-h-14 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0" />
            <Button type="submit" size="icon" disabled={busy || !text.trim()} aria-label="إرسال" title="إرسال" className="mb-1 size-10 shrink-0 rounded-lg"><Send className="-scale-x-100" /></Button>
          </form>
          <p className="mt-2 text-center text-xs text-muted-foreground" role={copyError ? "alert" : undefined}>{copyError ? "تعذّر النسخ. يمكنك تحديد نص الإجابة ونسخه." : "مساعد الاتحاد · معك في رحلتك الجامعية"}</p>
        </div>
      </section>
    </AppShell>
  );
}
