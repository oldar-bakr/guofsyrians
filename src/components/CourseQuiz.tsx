import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ClipboardCheck, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getCourseQuiz, submitCourseQuiz } from "@/lib/course-quiz.functions";
import { quizQuestionsSchema, type QuizQuestion } from "@/lib/course-quiz";

export function CourseQuiz({ courseId, enrolled }: { courseId: string; enrolled: boolean }) {
  const getQuiz = useServerFn(getCourseQuiz);
  const submit = useServerFn(submitCourseQuiz);
  const qc = useQueryClient();
  const { data: quiz, isLoading, isError } = useQuery({ queryKey: ["course-quiz", courseId], queryFn: () => getQuiz({ data: { courseId } }), enabled: enrolled });
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<{ score: number; total: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!enrolled || (!isLoading && !isError && !quiz)) return null;
  return <section className="mt-6 border-t pt-5">
    <h3 className="mb-4 flex items-center gap-2 font-display text-xl font-bold"><ClipboardCheck className="h-5 w-5 text-primary" />{quiz?.title ?? "اختبار الدورة"}</h3>
    {isLoading ? <LoadingSkeleton variant="form" /> : isError ? <p className="text-destructive">تعذّر تحميل الاختبار</p> : quiz && <>
      {result ? <div className="space-y-3 rounded-lg bg-secondary p-4"><p role="status" className="font-bold">نتيجتك: {result.score} من {result.total} ({Math.round(result.score / result.total * 100)}%)</p><Button variant="outline" onClick={() => { setResult(null); setAnswers({}); }}>إعادة المحاولة</Button></div> : <form className="space-y-5" onSubmit={async (e) => { e.preventDefault(); setBusy(true); setError(""); try { const value = await submit({ data: { courseId, quizId: quiz.id, answers: quiz.questions.map((_, i) => answers[i] ?? -1) } }); setResult(value); await qc.invalidateQueries({ queryKey: ["course-quiz", courseId] }); } catch (err) { setError(err instanceof Error ? err.message : "تعذّر إرسال الاختبار"); } finally { setBusy(false); } }}>
        {quiz.questions.map((q, i) => <fieldset key={i} disabled={busy} className="space-y-2"><legend className="mb-2 font-bold">{i + 1}. {q.prompt}</legend>{q.options.map((option, j) => <label key={j} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm ${answers[i] === j ? "border-primary bg-secondary" : "bg-card"}`}><input required type="radio" name={`question-${i}`} value={j} checked={answers[i] === j} onChange={() => setAnswers({ ...answers, [i]: j })} />{option}</label>)}</fieldset>)}
        <Button disabled={busy || Object.keys(answers).length !== quiz.questions.length}>{busy ? "جارٍ التصحيح…" : "إرسال الإجابات"}</Button>
      </form>}
      {quiz.attempts.length > 0 && <details className="mt-4 text-sm"><summary className="cursor-pointer font-bold">محاولاتي السابقة</summary><ul className="mt-2 space-y-2">{quiz.attempts.map((a) => <li key={a.id}>{a.score} / {a.total} · {new Date(a.created_at).toLocaleString("ar")}</li>)}</ul></details>}
    </>}
    {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
  </section>;
}

export function CourseQuizManager({ courseId }: { courseId: string }) {
  const qc = useQueryClient();
  const { data: quiz, isLoading, isError } = useQuery({ queryKey: ["admin-course-quiz", courseId], queryFn: async () => { const { data, error } = await supabase.from("course_quizzes").select("*").eq("course_id", courseId).maybeSingle(); if (error) throw error; return data; } });
  if (isLoading) return <LoadingSkeleton variant="form" />;
  if (isError) return <p className="text-destructive">تعذّر تحميل الاختبار</p>;
  return <QuizEditor key={JSON.stringify(quiz)} courseId={courseId} initial={quiz} onSaved={() => { qc.invalidateQueries({ queryKey: ["admin-course-quiz", courseId] }); qc.invalidateQueries({ queryKey: ["course-quiz", courseId] }); }} />;
}

function QuizEditor({ courseId, initial, onSaved }: { courseId: string; initial: { id: string; title: string; questions: unknown } | null | undefined; onSaved: () => void }) {
  const parsed = quizQuestionsSchema.safeParse(initial?.questions);
  const [title, setTitle] = useState(initial?.title ?? "اختبار الدورة");
  const [questions, setQuestions] = useState<QuizQuestion[]>(parsed.success ? parsed.data : []);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const patch = (i: number, change: Partial<QuizQuestion>) => setQuestions((items) => items.map((q, j) => j === i ? { ...q, ...change } : q));
  const save = async () => {
    setMessage("");
    const validated = quizQuestionsSchema.safeParse(questions);
    if (!title.trim() || !validated.success) return setMessage("اكتب عنوان الاختبار وكل سؤال وخياراته الأربعة، وحدد الإجابة الصحيحة.");
    setBusy(true);
    const { error } = await supabase.from("course_quizzes").upsert({ course_id: courseId, title: title.trim(), questions: validated.data }, { onConflict: "course_id" });
    setBusy(false);
    if (error) return setMessage("تعذّر حفظ الاختبار");
    setMessage("تم حفظ الاختبار"); onSaved();
  };
  return <section className="mt-4 space-y-4 border-t pt-4">
    <h4 className="flex items-center gap-2 font-bold"><ClipboardCheck className="h-4 w-4" />اختبار الدورة</h4>
    <label className="block text-sm">عنوان الاختبار<input maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded-lg border bg-background p-2" /></label>
    {questions.map((q, i) => <fieldset key={i} disabled={busy} className="space-y-2 border-b pb-4"><div className="flex justify-between"><legend className="font-bold">السؤال {i + 1}</legend><Button type="button" size="icon" variant="ghost" aria-label={`حذف السؤال ${i + 1}`} onClick={() => setQuestions(questions.filter((_, j) => i !== j))}><Trash2 /></Button></div><label className="block text-sm">نص السؤال<input value={q.prompt} maxLength={1000} onChange={(e) => patch(i, { prompt: e.target.value })} className="mt-1 w-full rounded-lg border bg-background p-2" /></label>{q.options.map((option, j) => <label key={j} className="flex items-center gap-2 text-sm"><input type="radio" name={`correct-${i}`} checked={q.correct === j} onChange={() => patch(i, { correct: j })} aria-label={`الإجابة الصحيحة للسؤال ${i + 1}: الخيار ${j + 1}`} /><input aria-label={`السؤال ${i + 1} الخيار ${j + 1}`} placeholder={`الخيار ${j + 1}`} maxLength={500} value={option} onChange={(e) => patch(i, { options: q.options.map((v, k) => k === j ? e.target.value : v) })} className="w-full rounded-lg border bg-background p-2" /></label>)}</fieldset>)}
    <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" disabled={busy || questions.length >= 30} onClick={() => setQuestions([...questions, { prompt: "", options: ["", "", "", ""], correct: 0 }])}><Plus />إضافة سؤال</Button><Button type="button" disabled={busy || !questions.length} onClick={save}>حفظ الاختبار</Button>{initial && <Button type="button" variant="destructive" disabled={busy} onClick={async () => { if (!confirm("حذف الاختبار وجميع محاولاته؟")) return; setBusy(true); const { error } = await supabase.from("course_quizzes").delete().eq("id", initial.id); setBusy(false); if (error) setMessage("تعذّر حذف الاختبار"); else onSaved(); }}>حذف الاختبار</Button>}</div>
    {message && <p role="status" className="text-sm">{message}</p>}
  </section>;
}