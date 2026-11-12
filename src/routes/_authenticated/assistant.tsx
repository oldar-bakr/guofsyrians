import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Check, Copy, Plus, RotateCcw, ArrowUp, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { askAssistant } from "@/lib/assistant.functions";
import { useStudent } from "@/lib/profile";
import logo from "@/assets/union-logo.png.asset.json";

export const Route = createFileRoute("/_authenticated/assistant")({
  staticData: { sitemap: false },
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
      <section className="mx-auto flex h-[calc(100dvh-11rem)] min-h-[320px] max-w-3xl flex-col md:h-[calc(100dvh-8rem)]" aria-label="المساعد الذكي">
        <div className="flex h-10 shrink-0 items-center justify-between gap-3">
          <h1 className="hidden text-sm font-medium text-muted-foreground md:block">المساعد الذكي</h1>
          {msgs.length > 0 && <Button variant="ghost" size="icon" disabled={busy} onClick={() => { setMsgs([]); setCopied(null); setCopyError(false); input.current?.focus(); }} title="محادثة جديدة" aria-label="محادثة جديدة" className="ms-auto text-muted-foreground"><Plus /></Button>}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-6" role="log" aria-label="المحادثة" aria-live="polite" aria-relevant="additions" aria-busy={busy}>
          {msgs.length === 0 ? (
            <div className="flex min-h-full flex-col items-center justify-center px-2 pb-12 text-center">
              <Sparkles className="mb-5 size-7 text-primary" strokeWidth={1.5} />
              <h2 className="font-display text-2xl font-bold text-primary">كيف أقدر أساعدك اليوم؟</h2>
              <p className="mt-3 text-sm text-muted-foreground">أهلاً{student.name ? `، ${student.name.split(" ")[0]}` : " بك"}</p>
              </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-6 px-1">
              {msgs.map((m, i) => (
                <div key={i} className={`flex items-start gap-3 ${m.from === "me" ? "flex-row-reverse" : ""}`}>
                  {m.from === "me" ? <Avatar path={student.avatar} name={student.name} university={student.university} className="size-8" textClass="text-xs" /> : <img src={logo.url} alt="المساعد" className="size-8 shrink-0 object-contain" />}
                  <div className={`min-w-0 max-w-[85%] ${m.from === "me" ? "text-end" : ""}`}>
                    <p className="mb-1.5 text-xs text-muted-foreground">{m.from === "me" ? "أنت" : "مساعد الاتحاد"}</p>
                    <div className={`whitespace-pre-wrap break-words rounded-lg text-start text-sm leading-7 ${m.from === "me" ? "bg-secondary px-4 py-3 text-secondary-foreground" : m.error ? "text-destructive" : "text-foreground"}`}>{m.text}</div>
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
          <form onSubmit={(e) => { e.preventDefault(); void send(text); }} className="flex items-end gap-2 rounded-2xl border bg-card p-2 focus-within:border-ring">
            <Textarea ref={input} value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} rows={1} aria-label="سؤالك للمساعد" placeholder="اكتب سؤالك..." onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void send(text); } }} className="max-h-36 min-h-10 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0" />
            <Button type="submit" size="icon" disabled={busy || !text.trim()} aria-label="إرسال" title="إرسال" className="size-10 shrink-0 rounded-full"><ArrowUp /></Button>
          </form>
          {copyError && <p className="mt-2 text-center text-xs text-muted-foreground" role="alert">تعذّر النسخ. يمكنك تحديد نص الإجابة ونسخه.</p>}
        </div>
      </section>
    </AppShell>
  );
}
