import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Send } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useContent } from "@/lib/content";
import { askAssistant } from "@/lib/assistant.functions";

export const Route = createFileRoute("/_authenticated/assistant")({
  head: () => ({
    meta: [
      { title: "المساعد الذكي | تطبيق خدمات الطلاب" },
      { name: "description", content: "مساعد ذكي يجيب عن أسئلة الطلاب حول الدراسة والخدمات والاتحاد." },
      { property: "og:title", content: "المساعد الذكي للطالب" },
      { property: "og:description", content: "اسأل عن الدراسة والخدمات." },
    ],
  }),
  component: Assistant,
});

type Msg = { from: "me" | "bot"; text: string };

function Assistant() {
  const ask = useServerFn(askAssistant);
  const { data: faqs = [] } = useContent<any>("faqs");
  const [msgs, setMsgs] = useState<Msg[]>([{ from: "bot", text: "أهلاً! أنا مساعدك الذكي. اسألني عن الدورات أو التخفيضات أو الفعاليات أو فروع الاتحاد." }]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async (q: string) => {
    if (!q.trim() || busy) return;
    const history = msgs.slice(1);
    setMsgs((m) => [...m, { from: "me", text: q }]);
    setText("");
    setBusy(true);
    try {
      const r = await ask({ data: { question: q, history } });
      setMsgs((m) => [...m, { from: "bot", text: r.answer }]);
    } catch (e) {
      setMsgs((m) => [...m, { from: "bot", text: e instanceof Error ? e.message : "حدث خطأ" }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell title="المساعد الذكي">
      <div className="space-y-3">
        {msgs.map((m, i) => (
          <div key={i} className={`max-w-[85%] whitespace-pre-wrap rounded-2xl p-3 text-sm ${m.from === "me" ? "mr-auto bg-primary text-primary-foreground" : "bg-card shadow-soft"}`}>{m.text}</div>
        ))}
        {busy && <div className="w-fit rounded-2xl bg-card p-3 text-sm text-muted-foreground shadow-soft">يكتب...</div>}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {faqs.slice(0, 4).map((f: any) => (
          <button key={f.id} onClick={() => send(f.question)} className="rounded-full border border-primary px-3 py-1 text-xs text-primary">{f.question}</button>
        ))}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(text); }} className="mt-4 flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="اكتب سؤالك..." className="flex-1 rounded-full border bg-card px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
        <button disabled={busy} aria-label="إرسال" className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-60"><Send className="h-4 w-4 -scale-x-100" /></button>
      </form>
    </AppShell>
  );
}
