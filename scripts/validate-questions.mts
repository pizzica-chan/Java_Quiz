import { questions } from "../src/questions.ts";
import { validateQuestions } from "../src/validateQuestions.ts";

const issues = validateQuestions(questions);
const errors = issues.filter((i) => i.severity === "error");
const warns = issues.filter((i) => i.severity === "warn");

for (const issue of issues) {
  const tag = issue.severity === "error" ? "ERROR" : "WARN";
  console.log(`[${tag}] Q${issue.questionId} ${issue.rule}: ${issue.message}`);
}

console.log(`\n検証完了: ${questions.length} 問, error=${errors.length}, warn=${warns.length}`);

if (errors.length > 0) {
  process.exit(1);
}
