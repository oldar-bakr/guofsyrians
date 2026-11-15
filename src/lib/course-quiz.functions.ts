import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { gradeQuiz, quizQuestionsSchema, studentQuestions } from "@/lib/course-quiz";

export const getCourseQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ courseId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { data: enrollment, error } = await context.supabase.from("course_enrollments").select("id").eq("course_id", data.courseId).eq("user_id", context.userId).limit(1).maybeSingle();
    if (error) throw new Error("تعذّر التحقق من التسجيل");
    if (!enrollment) throw new Error("سجّل في الدورة أولاً");
    const { data: course } = await context.supabase.from("courses").select("id").eq("id", data.courseId).eq("active", true).eq("status", "approved").maybeSingle();
    if (!course) throw new Error("الدورة غير متاحة");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: quiz, error: quizError } = await supabaseAdmin.from("course_quizzes").select("id,title,questions").eq("course_id", data.courseId).maybeSingle();
    if (quizError) throw new Error("تعذّر تحميل الاختبار");
    if (!quiz) return null;
    const questions = quizQuestionsSchema.parse(quiz.questions);
    const { data: attempts, error: attemptsError } = await context.supabase.from("course_quiz_attempts").select("id,score,total,created_at").eq("quiz_id", quiz.id).eq("user_id", context.userId).order("created_at", { ascending: false }).limit(5);
    if (attemptsError) throw new Error("تعذّر تحميل النتائج");
    return { id: quiz.id, title: quiz.title, questions: studentQuestions(questions), attempts: attempts ?? [] };
  });

export const submitCourseQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ courseId: z.string().uuid(), quizId: z.string().uuid(), answers: z.array(z.number().int().min(0).max(3)).min(1).max(30) }))
  .handler(async ({ data, context }) => {
    const { data: enrollment, error } = await context.supabase.from("course_enrollments").select("id").eq("course_id", data.courseId).eq("user_id", context.userId).limit(1).maybeSingle();
    if (error || !enrollment) throw new Error("سجّل في الدورة أولاً");
    const { data: course } = await context.supabase.from("courses").select("id").eq("id", data.courseId).eq("active", true).eq("status", "approved").maybeSingle();
    if (!course) throw new Error("الدورة غير متاحة");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: quiz, error: quizError } = await supabaseAdmin.from("course_quizzes").select("id,questions").eq("id", data.quizId).eq("course_id", data.courseId).maybeSingle();
    if (quizError || !quiz) throw new Error("الاختبار غير متاح");
    const result = gradeQuiz(quizQuestionsSchema.parse(quiz.questions), data.answers);
    const { error: saveError } = await supabaseAdmin.from("course_quiz_attempts").insert({ user_id: context.userId, quiz_id: quiz.id, answers: data.answers, ...result });
    if (saveError) throw new Error("تعذّر حفظ النتيجة");
    return result;
  });