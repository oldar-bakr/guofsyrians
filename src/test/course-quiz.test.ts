import { describe, it, expect } from "vitest";
import { gradeQuiz, studentQuestions } from "@/lib/course-quiz";
const questions = [{ prompt: "2 + 2?", options: ["1", "2", "3", "4"], correct: 3 }, { prompt: "3 + 1?", options: ["4", "5", "6", "7"], correct: 0 }];
describe("course quizzes", () => {
  it("grades using the answer key, not a supplied score", () => { expect(gradeQuiz(questions, [3, 1])).toEqual({ score: 1, total: 2 }); });
  it("rejects incomplete attempts", () => { expect(() => gradeQuiz(questions, [3])).toThrow(); });
  it("never sends correct answers in student questions", () => { expect(studentQuestions(questions)).toEqual(questions.map(({ prompt, options }) => ({ prompt, options }))); expect(studentQuestions(questions)[0]).not.toHaveProperty("correct"); });
});