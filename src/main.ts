import { createEmbedding, infrai } from "./infrai_client.js";
import { answerFromEvidence, eligibleDocuments, questionBody, type DeadlineDoc } from "./course_deadline_qa.js";

const request = questionBody.parse({ courseId: "algebra-101", learnerId: "learner-7", question: "What is due next?" });
const docs: DeadlineDoc[] = [{ courseId: "algebra-101", title: "Week 3 worksheet", text: "Submit exercises 1-8 in the portal.", dueDate: "2026-10-01" }];
const evidence = eligibleDocuments(request, docs, new Date().toISOString().slice(0, 10));
console.log(answerFromEvidence(request.question, evidence));

if (process.env.RUN_INFRAI === "1") {
  const embedding = await createEmbedding(request.question);
  const vector = (embedding.data[0] as { embedding: number[] }).embedding;
  const collection = `course-deadlines-${crypto.randomUUID()}`;
  await infrai.createCollection(collection, vector.length);
  try {
    await infrai.upsert(collection, [{ id: "week-3", values: vector, metadata: docs[0] }]);
    const matches = await infrai.query(collection, vector, 3) as { metadata?: { text?: string } }[];
    const ranked = await infrai.rerank(request.question, matches.map(m => m.metadata?.text ?? ""), 1) as { data?: Array<{ index: number }> };
    console.log(ranked);
  } finally {
    await infrai.deleteCollection(collection);
  }
}
