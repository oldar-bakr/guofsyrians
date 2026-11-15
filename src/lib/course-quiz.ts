import { z } from "zod";

export const quizQuestionSchema = z.object({
  prompt: z.string().trim().min(1).max(1000),
  options: z.array(z.string().trim().min(1).max(500)).length(4),
  correct: z.number().int().min(0).max(3),
});
export const quizQuestionsSchema = z.array(quizQuestionSchema).min(1).max(30);
export type QuizQuestion = z.infer<typeof quizQuestionSchema>;
export type StudentQuestion = Pick<QuizQuestion, "prompt" | "options">;

export function gradeQuiz(questions: QuizQuestion[], answers: number[]) {
  if (answers.length !== questions.length || answers.some((a) => !Number.isInteger(a) || a < 0 || a > 3)) throw new Error("أجب عن جميع الأسئلة");
  return { score: questions.reduce((sum, q, i) => sum + Number(q.correct === answers[i]), 0), total: questions.length };
}
export function studentQuestions(questions: QuizQuestion[]): StudentQuestion[] {
  return questions.map(({ prompt, options }) => ({ prompt, options }));
}