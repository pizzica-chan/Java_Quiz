import { computeBraceDepths, highlightJava } from "../src/javaHighlight.ts";
import { questions } from "../src/questions.ts";

const BROKEN_ENTITY = /<span[^>]*>\s*(lt|gt|quot|amp)\s*<\/span>\s*;/;

function visibleText(html: string): string {
  const withoutTags = html.replace(/<[^>]+>/g, "");
  return withoutTags
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&");
}

type Issue = {
  questionId: number;
  lineNo: number;
  line: string;
  kind: string;
  detail: string;
};

const issues: Issue[] = [];

for (const q of questions) {
  const depths = computeBraceDepths(q.code);
  q.code.forEach((line, index) => {
    const lineNo = index + 1;
    const html = highlightJava(line, lineNo, null, null, depths[index]);
    const text = visibleText(html);

    if (text !== line) {
      issues.push({
        questionId: q.id,
        lineNo,
        line,
        kind: "text-mismatch",
        detail: `visible="${text}"`,
      });
    }

    if (BROKEN_ENTITY.test(html)) {
      issues.push({
        questionId: q.id,
        lineNo,
        line,
        kind: "broken-entity",
        detail: html,
      });
    }
  });
}

console.log("=== Highlight audit ===");
console.log(`Questions: ${questions.length}`);
console.log(`Code lines: ${questions.reduce((n, q) => n + q.code.length, 0)}`);
console.log(`Issues: ${issues.length}`);

if (issues.length > 0) {
  for (const issue of issues.slice(0, 30)) {
    console.log(`Q${issue.questionId} L${issue.lineNo} [${issue.kind}] ${issue.line}`);
    console.log(`  ${issue.detail}`);
  }
}

console.log("\n=== Quality spot checks ===");

type Sample = {
  label: string;
  lines: string[];
  checkLine: number;
  expect: RegExp;
};

const samples: Sample[] = [
  {
    label: "field at class body",
    lines: ["public class A {", "    private final String id;", "}"],
    checkLine: 1,
    expect: /tok-field[^>]*>id</,
  },
  {
    label: "local inside method",
    lines: [
      "public class A {",
      "    void m() {",
      '        String result = "";',
      "    }",
      "}",
    ],
    checkLine: 2,
    expect: /tok-var[^>]*>result</,
  },
  {
    label: "method param",
    lines: ["public class A {", "    boolean isAdmin(String username) {", "    }", "}"],
    checkLine: 1,
    expect: /tok-var[^>]*>username</,
  },
  {
    label: "instanceof pattern var",
    lines: ["        return o instanceof CacheKey k && id == k.id;"],
    checkLine: 0,
    expect: /tok-var[^>]*>k</,
  },
  {
    label: "block comment intact",
    lines: ["        void use() { /* work */ }"],
    checkLine: 0,
    expect: /tok-cmt[^>]*>\/\* work \*\/</,
  },
  {
    label: "underscored number",
    lines: ["        return x > 86_400_000;"],
    checkLine: 0,
    expect: /tok-num[^>]*>86_400_000</,
  },
];

let qualityFails = 0;
for (const sample of samples) {
  const depths = computeBraceDepths(sample.lines);
  const idx = sample.checkLine;
  const html = highlightJava(sample.lines[idx]!, idx + 1, null, null, depths[idx]);
  const ok = sample.expect.test(html) && visibleText(html) === sample.lines[idx];
  console.log(`${ok ? "OK" : "FAIL"}: ${sample.label} (depth=${depths[idx]})`);
  if (!ok) {
    qualityFails += 1;
    console.log(`  line: ${sample.lines[idx]}`);
    console.log(`  html: ${html}`);
  }
}

process.exit(issues.length > 0 || qualityFails > 0 ? 1 : 0);
