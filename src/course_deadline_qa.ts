import { z } from "zod";

export const questionBody = z.object({ courseId: z.string().min(1), question: z.string().min(1), learnerId: z.string().min(1) });
export type DeadlineDoc = { courseId: string; title: string; text: string; dueDate: string };

export function eligibleDocuments(body: z.infer<typeof questionBody>, docs: DeadlineDoc[], today: string): DeadlineDoc[] {
  return docs.filter(doc => doc.courseId === body.courseId && doc.dueDate >= today);
}

export function answerFromEvidence(question: string, docs: DeadlineDoc[]): string {
  if (!docs.length) return "No upcoming deadline is recorded for this course.";
  return `${question}\n\n${docs.map(d => `${d.title} (due ${d.dueDate}): ${d.text}`).join("\n")}`;
}
