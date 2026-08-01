import { questions } from "../src/questions.ts";
import { validateQuestions } from "../src/validateQuestions.ts";

const cases = [
  { id: 31, lines: [11], label: "Q31 -> run()" },
  { id: 34, lines: [15], label: "Q34 -> }" },
  { id: 61, lines: [14], label: "Q61 -> catch" },
  { id: 53, lines: [18], label: "Q53 -> hashCode decl" },
];

for (const c of cases) {
  const all = questions.map((q) =>
    q.id === c.id ? { ...q, antiPatternLines: c.lines } : q,
  );
  const errs = validateQuestions(all).filter(
    (i) => i.severity === "error" && i.questionId === c.id,
  );
  console.log(
    `${errs.length > 0 ? "CATCH" : "MISS"} ${c.label} [${errs.map((e) => e.rule).join(", ")}]`,
  );
}
