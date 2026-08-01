import type { QuizQuestion } from "./quizTypes";
import { isIgnorableLine, isSubstantiveLine } from "./quizUtils";

export type QuestionValidationIssue = {
  questionId: number;
  severity: "error" | "warn";
  rule: string;
  message: string;
};

/**
 * 過去に実際にずれたケースの回帰用。新規問題の網羅は構造ルールに寄せる。
 * 解説にこの断片があり、コード上にもあるのに正解行に無いときだけ error。
 */
const REGRESSION_EXPLANATION_MARKERS: RegExp[] = [
  /printStackTrace/,
  /ready\s*=\s*true/,
  /charAt\s*\(\s*0\s*\)/,
  /\breturn\s+1\b/,
  /new\s+String\s*\(/,
  /return\s+List\.of\s*\(\s*\)/,
  /IllegalStateException\s*\(\s*"save failed"\s*\)/,
];

/** 捕捉型そのものがアンチパターン（catch 行が正解でよい） */
function isBroadCatchLine(line: string): boolean {
  return /\bcatch\s*\(\s*(Exception|Throwable|Error|RuntimeException)\b/.test(line);
}

/** catch の次行が「本体のアンチパターン」っぽいとき */
function looksLikeCatchBodyAntipattern(nextLine: string): boolean {
  const t = nextLine.trim();
  if (/printStackTrace\s*\(/.test(t)) return true;
  if (/^return\s+List\.of\s*\(\s*\)\s*;/.test(t)) return true;
  // throw new X("msg") without cause argument
  if (/^throw\s+new\s+\w+\s*\(\s*"[^"]*"\s*\)\s*;/.test(t)) return true;
  if (/^throw\s+new\s+\w+\s*\(\s*'[^']*'\s*\)\s*;/.test(t)) return true;
  return false;
}

/** メソッド宣言行で、本体が次行にあるべき典型 */
function isMethodDeclWithBodyAntipattern(line: string, nextLine: string): boolean {
  if (!/^(public|private|protected).+\{\s*$/.test(line.trim())) return false;
  if (!/\b(hashCode|equals|compare|compareTo)\s*\(/.test(line)) return false;
  const next = nextLine.trim();
  // 定数 return / 自明な1行本体
  return /^(return\s+.+;|throw\s+.+;)/.test(next);
}

/**
 * 正解行が `{` で終わり次行が実質文 → 宣言ずれの疑い。
 * ただし条件判定・広すぎる catch・制御構文そのものが問題のケースは除外。
 */
function isAllowedOpeningBraceAnswer(line: string, q: QuizQuestion): boolean {
  const t = line.trim();

  if (isBroadCatchLine(t)) return true;

  // if / while / for / synchronized / try の条件行そのものが観点
  if (/^\}\s*?(else\s+)?if\s*\(/.test(t) || /^(if|while|for|synchronized)\s*\(/.test(t)) {
    return true;
  }
  if (/^try\s*(\(|\{)/.test(t) || /^}\s*finally\s*\{/.test(t) || /^}\s*else\s*\{/.test(t)) {
    return true;
  }

  // クラス/インターフェース宣言
  if (/\b(class|interface|enum)\b/.test(t)) return true;

  // finalize など「メソッドの存在自体」がアンチパターン
  if (/\bfinalize\s*\(/.test(t)) return true;

  // synchronized メソッド宣言そのものが粒度の問題になるケース
  if (/\bsynchronized\b/.test(t) && /\([^)]*\)\s*\{\s*$/.test(t)) return true;

  if (q.antiPatternLines.length > 1) return true;

  return false;
}

function answerContains(q: QuizQuestion, token: string): boolean {
  const compact = token.replace(/\s+/g, "");
  return q.antiPatternLines.some((n) => {
    const line = q.code[n - 1] ?? "";
    return line.includes(token) || line.replace(/\s+/g, "").includes(compact);
  });
}

function codeContains(q: QuizQuestion, token: string): number[] {
  const compact = token.replace(/\s+/g, "");
  return q.code
    .map((line, i) =>
      line.includes(token) || line.replace(/\s+/g, "").includes(compact) ? i + 1 : -1,
    )
    .filter((i) => i > 0);
}

/** 解説からコード断片らしきものを抽出（補助・warn 用）。提案コードの "..." 引用は除外 */
function extractExplanationFragments(explanation: string): string[] {
  const out: string[] = [];
  for (const m of explanation.matchAll(/[「`]([^」`]{3,80})[」`]/g)) {
    out.push(m[1]!);
  }
  return [...new Set(out)];
}

export function validateQuestions(questions: QuizQuestion[]): QuestionValidationIssue[] {
  const issues: QuestionValidationIssue[] = [];
  const seenIds = new Set<number>();

  for (const q of questions) {
    if (seenIds.has(q.id)) {
      issues.push({
        questionId: q.id,
        severity: "error",
        rule: "unique-id",
        message: `問題 ID ${q.id} が重複しています`,
      });
    }
    seenIds.add(q.id);

    if (q.antiPatternLines.length === 0) {
      issues.push({
        questionId: q.id,
        severity: "error",
        rule: "non-empty-answers",
        message: "antiPatternLines が空です",
      });
      continue;
    }

    const dupAnswers = q.antiPatternLines.filter((n, i, arr) => arr.indexOf(n) !== i);
    if (dupAnswers.length > 0) {
      issues.push({
        questionId: q.id,
        severity: "error",
        rule: "unique-answer-lines",
        message: `正解行が重複: ${[...new Set(dupAnswers)].join(", ")}`,
      });
    }

    for (const lineNo of q.antiPatternLines) {
      if (lineNo < 1 || lineNo > q.code.length) {
        issues.push({
          questionId: q.id,
          severity: "error",
          rule: "in-bounds",
          message: `正解行 ${lineNo} が範囲外です（1〜${q.code.length}）`,
        });
        continue;
      }

      const line = q.code[lineNo - 1]!;
      if (isIgnorableLine(line)) {
        issues.push({
          questionId: q.id,
          severity: "error",
          rule: "not-ignorable",
          message: `正解行 ${lineNo} が無視可能行です: ${JSON.stringify(line)}`,
        });
        continue;
      }

      const trimmed = line.trim();
      const next = q.code[lineNo] ?? "";
      const nextTrim = next.trim();

      // catch 宣言 + 次行が本体アンチパターン（キーワード非依存）
      if (/catch\s*\([^)]+\)\s*\{\s*$/.test(trimmed) && !isBroadCatchLine(trimmed)) {
        if (isSubstantiveLine(next) && looksLikeCatchBodyAntipattern(nextTrim)) {
          issues.push({
            questionId: q.id,
            severity: "error",
            rule: "catch-not-body",
            message: `正解行 ${lineNo} は catch 宣言ですが、問題本体は次行の可能性: ${JSON.stringify(nextTrim)}`,
          });
        }
      }

      // hashCode 等の宣言行だけが正解
      if (isMethodDeclWithBodyAntipattern(trimmed, nextTrim)) {
        issues.push({
          questionId: q.id,
          severity: "error",
          rule: "method-decl-not-body",
          message: `正解行 ${lineNo} はメソッド宣言です。本体は次行: ${JSON.stringify(nextTrim)}`,
        });
      }

      // `{` 終わり + 次が実質 → 除外以外は warn（ビルドは落とさない）
      if (
        trimmed.endsWith("{") &&
        isSubstantiveLine(next) &&
        !isAllowedOpeningBraceAnswer(trimmed, q)
      ) {
        issues.push({
          questionId: q.id,
          severity: "warn",
          rule: "opening-brace-answer",
          message: `正解行 ${lineNo} が \`{\` で終わり、次行が実質文です。宣言ずれでないか確認: ${JSON.stringify(nextTrim)}`,
        });
      }
    }

    // 回帰マーカー
    for (const marker of REGRESSION_EXPLANATION_MARKERS) {
      const match = q.explanation.match(marker);
      if (!match) continue;
      const token = match[0];
      if (answerContains(q, token)) continue;
      const hits = codeContains(q, token);
      if (hits.length === 0) continue;
      issues.push({
        questionId: q.id,
        severity: "error",
        rule: "regression-explanation-marker",
        message: `解説の「${token}」は行 [${hits.join(", ")}] にありますが、正解は [${q.antiPatternLines.join(", ")}] です`,
      });
    }

    // 解説の引用断片（補助: コードにあり正解に無い → warn）
    for (const frag of extractExplanationFragments(q.explanation)) {
      if (frag.length < 4) continue;
      // 提案・正解例っぽい断片はスキップ
      if (/しましょう|使いましょう|推奨|代わり/.test(q.explanation) && !q.code.some((l) => l.includes(frag))) {
        continue;
      }
      const hits = codeContains(q, frag);
      if (hits.length === 0) continue;
      if (hits.some((h) => q.antiPatternLines.includes(h))) continue;
      // 対照コードにだけある断片はよくあるので warn
      issues.push({
        questionId: q.id,
        severity: "warn",
        rule: "explanation-fragment",
        message: `解説断片「${frag}」は行 [${hits.join(", ")}] にありますが正解外です（要確認）`,
      });
    }
  }

  return issues;
}

export function assertQuestionsValid(questions: QuizQuestion[]): void {
  const issues = validateQuestions(questions);
  const errors = issues.filter((i) => i.severity === "error");
  if (errors.length === 0) return;

  const lines = errors.map((i) => `Q${i.questionId} [${i.rule}] ${i.message}`);
  throw new Error(`クイズ問題の検証に失敗しました:\n${lines.join("\n")}`);
}
