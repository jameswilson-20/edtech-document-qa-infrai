import assert from "node:assert/strict";
import { answerFromEvidence, eligibleDocuments, type DeadlineDoc } from "./course_deadline_qa.js";

const docs: DeadlineDoc[] = [
  { courseId: "c1", title: "Open", text: "Read chapter 2.", dueDate: "2026-09-12" },
  { courseId: "c1", title: "Past", text: "Read chapter 1.", dueDate: "2026-09-01" },
  { courseId: "c2", title: "Other", text: "Essay.", dueDate: "2026-09-20" }
];
const selected = eligibleDocuments({ courseId: "c1", learnerId: "l1", question: "next?" }, docs, "2026-09-10");
assert.equal(selected.length, 1);
assert.match(answerFromEvidence("next?", selected), /Open \(due 2026-09-12\)/);
console.log("course deadline decision: ok");
