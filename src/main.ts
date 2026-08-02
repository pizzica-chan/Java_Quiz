import "./style.css";
import { computeBraceDepths, highlightJava } from "./javaHighlight";
import {
  clearProgress,
  computeScore,
  getProgressSummary,
  getValidProgress,
  hasStartedProgress,
  saveProgress,
  type DifficultyProgress,
  type ProgressSummary,
  type QuestionAttempt,
} from "./progressStorage";
import {
  DIFFICULTY_META,
  countByDifficulty,
  getQuestionsByDifficulty,
  getSelectionGuide,
  isSelectionCorrect,
  shuffleQuestions,
  type Difficulty,
  type QuizQuestion,
} from "./questions";

type Screen = "start" | "quiz" | "list" | "result";

interface AppState {
  screen: Screen;
  difficulty: Difficulty;
  quizQuestions: QuizQuestion[];
  currentIndex: number;
  questionResults: (boolean | null)[];
  questionAttempts: (QuestionAttempt | null)[];
  selectedLines: Set<number>;
  answered: boolean;
  score: number;
  lastCorrect: boolean | null;
  showHint: boolean;
  highlightedSymbol: string | null;
  highlightedSymbolLine: number | null;
  listOrigin: "start" | "quiz";
  listQuizDifficulty: Difficulty | null;
}

const state: AppState = {
  screen: "start",
  difficulty: "beginner",
  quizQuestions: [],
  currentIndex: 0,
  questionResults: [],
  questionAttempts: [],
  selectedLines: new Set(),
  answered: false,
  score: 0,
  lastCorrect: null,
  showHint: false,
  highlightedSymbol: null,
  highlightedSymbolLine: null,
  listOrigin: "start",
  listQuizDifficulty: null,
};

const app = document.getElementById("app")!;

const DIFFICULTIES: Difficulty[] = ["beginner", "intermediate", "advanced"];

function getDifficultyQuestionIds(difficulty: Difficulty): Set<number> {
  return new Set(getQuestionsByDifficulty(difficulty).map((q) => q.id));
}

function getDifficultyProgressSummary(difficulty: Difficulty): ProgressSummary | null {
  const total = countByDifficulty(difficulty);
  return getProgressSummary(difficulty, getDifficultyQuestionIds(difficulty), total);
}

function resetCurrentQuestionUi(): void {
  state.selectedLines = new Set();
  state.answered = false;
  state.lastCorrect = null;
  state.showHint = false;
  state.highlightedSymbol = null;
  state.highlightedSymbolLine = null;
}

function syncScoreFromResults(): void {
  state.score = computeScore(state.questionResults);
}

function initQuestionTracking(total: number): void {
  state.questionResults = Array<boolean | null>(total).fill(null);
  state.questionAttempts = Array<QuestionAttempt | null>(total).fill(null);
}

function applyQuestionState(index: number): void {
  const attempt = state.questionAttempts[index];
  const result = state.questionResults[index];

  if (result !== null && attempt) {
    state.selectedLines = new Set(attempt.selectedLines);
    state.answered = true;
    state.lastCorrect = attempt.lastCorrect;
    state.showHint = attempt.showHint;
  } else if (attempt) {
    state.selectedLines = new Set(attempt.selectedLines);
    state.answered = false;
    state.lastCorrect = null;
    state.showHint = attempt.showHint;
  } else {
    resetCurrentQuestionUi();
  }

  state.highlightedSymbol = null;
  state.highlightedSymbolLine = null;
}

/** 未提出の選択・ヒントを問題単位で退避する */
function stashCurrentQuestionDraft(): void {
  if (!sessionMatchesDifficulty()) return;

  const index = state.currentIndex;
  if (state.questionResults[index] !== null) return;

  if (state.selectedLines.size === 0 && !state.showHint) {
    state.questionAttempts[index] = null;
    return;
  }

  state.questionAttempts[index] = {
    selectedLines: [...state.selectedLines],
    lastCorrect: null,
    showHint: state.showHint,
  };
}

function captureProgress(): DifficultyProgress {
  return {
    questionIds: state.quizQuestions.map((q) => q.id),
    currentIndex: state.currentIndex,
    questionResults: [...state.questionResults],
    questionAttempts: state.questionAttempts.map((attempt) =>
      attempt ? { ...attempt, selectedLines: [...attempt.selectedLines] } : null,
    ),
    selectedLines: [...state.selectedLines],
    answered: state.answered,
    lastCorrect: state.lastCorrect,
    showHint: state.showHint,
    updatedAt: Date.now(),
  };
}

function sessionMatchesDifficulty(): boolean {
  return (
    state.quizQuestions.length > 0 &&
    state.questionResults.length === state.quizQuestions.length &&
    state.quizQuestions.every((q) => q.difficulty === state.difficulty)
  );
}

function saveCurrentDifficultySession(): void {
  if (!sessionMatchesDifficulty()) return;
  stashCurrentQuestionDraft();
  const progress = captureProgress();
  if (!hasStartedProgress(progress)) {
    clearProgress(state.difficulty);
    return;
  }
  saveProgress(state.difficulty, progress);
}

function persistCurrentProgress(): void {
  if (state.screen !== "quiz" || state.quizQuestions.length === 0) return;
  saveCurrentDifficultySession();
}

function restoreQuizFromProgress(progress: DifficultyProgress): boolean {
  const pool = getQuestionsByDifficulty(state.difficulty);
  const byId = new Map(pool.map((q) => [q.id, q]));
  const quizQuestions = progress.questionIds
    .map((id) => byId.get(id))
    .filter((q): q is QuizQuestion => q !== undefined);

  if (quizQuestions.length !== progress.questionIds.length) {
    clearProgress(state.difficulty);
    return false;
  }

  state.quizQuestions = quizQuestions;
  state.currentIndex = progress.currentIndex;
  state.questionResults = [...progress.questionResults];
  state.questionAttempts = progress.questionAttempts.map((attempt) =>
    attempt ? { ...attempt, selectedLines: [...attempt.selectedLines] } : null,
  );
  syncScoreFromResults();
  applyQuestionState(progress.currentIndex);

  // ドラフト未退避の旧データ互換: attempt が無い現在問はトップレベル状態を使う
  if (
    state.questionResults[progress.currentIndex] === null &&
    !state.questionAttempts[progress.currentIndex]
  ) {
    state.selectedLines = new Set(progress.selectedLines);
    state.answered = progress.answered;
    state.lastCorrect = progress.lastCorrect;
    state.showHint = progress.showHint;
  }
  return true;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderStart(): void {
  const difficultyCards = DIFFICULTIES.map((d, index) => {
    const meta = DIFFICULTY_META[d];
    const count = countByDifficulty(d);
    const selected = state.difficulty === d;
    const num = String(index + 1).padStart(2, "0");
    const saved = getDifficultyProgressSummary(d);
    const progressHtml = saved
      ? `<span class="difficulty-progress">${saved.answeredCount} / ${saved.total}・スコア ${saved.score}</span>`
      : "";
    return `
      <button
        type="button"
        class="difficulty-card ${meta.color} ${selected ? "selected" : ""}"
        data-difficulty="${d}"
        aria-pressed="${selected}"
      >
        <span class="difficulty-index">(${num})</span>
        <span class="difficulty-main">
          <span class="difficulty-label">${meta.label}</span>
          <span class="difficulty-desc">${meta.description}</span>
          ${progressHtml}
        </span>
        <span class="difficulty-count">${count} Q</span>
      </button>
    `;
  }).join("");

  const meta = DIFFICULTY_META[state.difficulty];
  const selectedProgress = getDifficultyProgressSummary(state.difficulty);
  const startLabel = selectedProgress
    ? `続きから（${selectedProgress.answeredCount} / ${selectedProgress.total}）`
    : `${meta.label}で始める`;

  app.innerHTML = `
    <main class="container">
      <header class="hero">
        <h1 class="hero-title">Java<br />アンチパターン<br />クイズ</h1>
        <p class="lead">
          Java のコードサンプルを読み、アンチパターンになっている行を見つけましょう。
          難易度を選んで挑戦できます。
        </p>
      </header>

      <section class="card difficulty-section">
        <p class="section-label">(Difficulty)</p>
        <h2>難易度を選択</h2>
        <div class="difficulty-grid" role="group" aria-label="難易度">
          ${difficultyCards}
        </div>
      </section>

      <section class="card info-card">
        <p class="section-label">(How to play)</p>
        <h2>遊び方</h2>
        <ol>
          <li data-index="01">難易度を選んで「クイズを始める」を押します</li>
          <li data-index="02">問題文の観点に沿って、アンチパターンの行をクリックします</li>
          <li data-index="03">同種の問題が複数行ある場合は、代表の1行でも正解です</li>
          <li data-index="04">「回答する」で採点。解説を読んで次へ進みます</li>
        </ol>
      </section>

      <div class="start-actions">
        <button class="btn btn-primary btn-large" id="start-btn">
          ${startLabel}
        </button>
        <button class="btn btn-ghost" id="list-btn" type="button">問題一覧から選ぶ</button>
        ${
          selectedProgress
            ? `<button class="btn btn-ghost" id="fresh-start-btn" type="button">最初から</button>`
            : ""
        }
      </div>
    </main>
  `;

  document.querySelectorAll("[data-difficulty]").forEach((el) => {
    el.addEventListener("click", () => {
      state.difficulty = el.getAttribute("data-difficulty") as Difficulty;
      renderStart();
    });
  });

  document.getElementById("start-btn")!.addEventListener("click", () => startQuiz(false));
  document.getElementById("list-btn")!.addEventListener("click", () => openQuestionList("start"));
  document.getElementById("fresh-start-btn")?.addEventListener("click", () => startQuiz(true));
}

function renderListDifficultyTabs(): string {
  return DIFFICULTIES.map((d) => {
    const meta = DIFFICULTY_META[d];
    const total = countByDifficulty(d);
    const summary = getDifficultyProgressSummary(d);
    const selected = state.difficulty === d;
    const progressText = summary
      ? `${summary.answeredCount} / ${summary.total}`
      : `0 / ${total}`;

    return `
      <button
        type="button"
        class="list-difficulty-tab ${meta.color} ${selected ? "selected" : ""}"
        data-list-difficulty="${d}"
        role="tab"
        aria-selected="${selected}"
      >
        <span class="list-difficulty-tab-label">${meta.label}</span>
        <span class="list-difficulty-tab-progress">${progressText}</span>
      </button>
    `;
  }).join("");
}

function switchListDifficulty(difficulty: Difficulty): void {
  if (difficulty === state.difficulty) return;

  saveCurrentDifficultySession();
  state.difficulty = difficulty;
  ensureQuizSession();
  renderQuestionList();
}

function renderQuestionList(): void {
  if (!sessionMatchesDifficulty()) {
    ensureQuizSession();
  }

  const meta = DIFFICULTY_META[state.difficulty];
  const total = state.quizQuestions.length;
  const answeredCount = state.questionResults.filter((r) => r !== null).length;

  const items = state.quizQuestions
    .map((question, index) => {
      const result = state.questionResults[index];
      const isCurrent = index === state.currentIndex;
      let statusLabel = "未回答";
      let statusClass = "pending";

      if (result === true) {
        statusLabel = "正解";
        statusClass = "correct";
      } else if (result === false) {
        statusLabel = "不正解";
        statusClass = "wrong";
      }

      return `
        <button
          type="button"
          class="question-list-item ${isCurrent ? "current" : ""}"
          data-question-index="${index}"
        >
          <span class="question-list-no">${String(index + 1).padStart(2, "0")}</span>
          <span class="question-list-main">
            <span class="question-list-title">${escapeHtml(question.title)}</span>
            <span class="question-list-pattern">${escapeHtml(question.patternName)}</span>
          </span>
          <span class="question-list-status ${statusClass}">${statusLabel}</span>
        </button>
      `;
    })
    .join("");

  app.innerHTML = `
    <main class="container">
      <header class="list-header">
        <p class="section-label">(Questions)</p>
        <h1>問題一覧</h1>
        <p class="list-summary">${meta.label}・回答済み ${answeredCount} / ${total}・スコア ${state.score}</p>
      </header>

      <div class="list-difficulty-tabs" role="tablist" aria-label="難易度">
        ${renderListDifficultyTabs()}
      </div>

      <section class="card question-list-section" aria-label="問題一覧">
        <div class="question-list">${items}</div>
      </section>

      <button class="btn btn-ghost btn-large" id="list-back-btn" type="button">戻る</button>
    </main>
  `;

  document.querySelectorAll("[data-list-difficulty]").forEach((el) => {
    el.addEventListener("click", () => {
      switchListDifficulty(el.getAttribute("data-list-difficulty") as Difficulty);
    });
  });

  document.querySelectorAll("[data-question-index]").forEach((el) => {
    el.addEventListener("click", () => {
      goToQuestion(Number(el.getAttribute("data-question-index")));
    });
  });

  document.getElementById("list-back-btn")!.addEventListener("click", () => {
    saveCurrentDifficultySession();

    if (state.listOrigin === "quiz" && state.listQuizDifficulty) {
      state.difficulty = state.listQuizDifficulty;
      ensureQuizSession();
      state.screen = "quiz";
    } else {
      state.screen = "start";
    }

    render();
  });
}

function goToTop(): void {
  persistCurrentProgress();
  state.screen = "start";
  render();
}

function renderQuiz(): void {
  const question = state.quizQuestions[state.currentIndex];
  const total = state.quizQuestions.length;
  const answeredCount = state.questionResults.filter((r) => r !== null).length;
  const progress = total === 0 ? 0 : (answeredCount / total) * 100;
  const meta = DIFFICULTY_META[state.difficulty];

  const braceDepths = computeBraceDepths(question.code);
  const codeHtml = question.code
    .map((line, index) => {
      const lineNo = index + 1;
      const isSelected = state.selectedLines.has(lineNo);
      const isAnswerLine = question.antiPatternLines.includes(lineNo);
      const isAntiPattern = state.answered && isAnswerLine && isSelected;
      const isWrongPick =
        state.answered && isSelected && !isAnswerLine;
      const isAlsoAnswer =
        state.answered &&
        !isSelected &&
        isAnswerLine;

      const classes = ["code-line"];
      if (isSelected) classes.push("selected");
      if (isAntiPattern) classes.push("correct");
      if (isWrongPick) classes.push("wrong");
      if (isAlsoAnswer) classes.push("missed");
      if (!state.answered) classes.push("clickable");

      return `
        <div class="${classes.join(" ")}" data-line="${lineNo}" role="button" tabindex="0" aria-pressed="${isSelected}">
          <span class="line-no">${lineNo}</span>
          <code class="line-code">${highlightJava(line, lineNo, state.highlightedSymbol, state.highlightedSymbolLine, braceDepths[index]) || "&nbsp;"}</code>
        </div>
      `;
    })
    .join("");

  const missedAnswers =
    state.answered &&
    question.antiPatternLines.some((line) => !state.selectedLines.has(line));

  const feedbackHtml = state.answered
    ? `
      <div class="feedback ${state.lastCorrect ? "feedback-correct" : "feedback-wrong"}">
        <div class="feedback-header">
          <span class="feedback-icon">${state.lastCorrect ? "✓" : "✗"}</span>
          <strong>${state.lastCorrect ? "正解！" : "不正解"}</strong>
        </div>
        <p class="pattern-name">${escapeHtml(question.patternName)}</p>
        <p>${escapeHtml(question.explanation)}</p>
        ${
          state.lastCorrect && missedAnswers
            ? `<p class="feedback-note">同じアンチパターンの行がほかにもあります（オレンジの行）。解説とあわせて確認しましょう。</p>`
            : ""
        }
      </div>
    `
    : "";

  const selectionGuide = getSelectionGuide(question);

  const allAnswered = state.questionResults.every((r) => r !== null);
  const nextLabel =
    state.currentIndex < total - 1
      ? "次の問題へ"
      : allAnswered
        ? "結果を見る"
        : "問題一覧へ";

  const hintHtml =
    state.showHint && question.hint && !state.answered
      ? `<p class="hint">ヒント: ${escapeHtml(question.hint)}</p>`
      : "";

  app.innerHTML = `
    <main class="container">
      <header class="quiz-header">
        <div class="quiz-meta">
          <span>
            <span class="diff-pill ${meta.color}">${meta.label}</span>
            Q ${state.currentIndex + 1} / ${total}
          </span>
          <span class="quiz-meta-actions">
            <button class="btn-link" id="quiz-home-btn" type="button">TOP</button>
            <button class="btn-link" id="quiz-list-btn" type="button">一覧</button>
            <span>Score ${state.score}</span>
          </span>
        </div>
        <div class="progress-bar" aria-hidden="true">
          <div class="progress-fill" style="width: ${progress}%"></div>
        </div>
      </header>

      <section class="card question-card">
        <h2>${escapeHtml(question.title)}</h2>
        <p class="selection-guide">${escapeHtml(selectionGuide)}</p>
        <p class="question-desc">${escapeHtml(question.description)}</p>
        ${hintHtml}

        <div class="code-block" role="group" aria-label="Java コード">
          <div class="code-toolbar">
            <span class="filename">Example.java</span>
          </div>
          <div class="code-lines">${codeHtml}</div>
        </div>

        ${feedbackHtml}

        <div class="actions">
          ${
            !state.answered
              ? `
            <button class="btn btn-ghost" id="hint-btn" ${state.showHint ? "disabled" : ""}>
              ヒント
            </button>
            <button class="btn btn-primary" id="submit-btn" ${state.selectedLines.size === 0 ? "disabled" : ""}>
              回答する
            </button>
          `
              : `
            <button class="btn btn-primary" id="next-btn">
              ${nextLabel}
            </button>
          `
          }
        </div>
      </section>
    </main>
  `;

  document.getElementById("quiz-home-btn")?.addEventListener("click", goToTop);
  document.getElementById("quiz-list-btn")?.addEventListener("click", () => openQuestionList("quiz"));

  document.querySelector(".code-lines")?.addEventListener("click", (e) => {
    const symEl = (e.target as HTMLElement).closest(".sym") as HTMLElement | null;
    if (!symEl) return;

    e.stopPropagation();

    const name = symEl.getAttribute("data-sym");
    if (!name) return;

    const lineEl = symEl.closest(".code-line");
    const lineNo = lineEl ? Number(lineEl.getAttribute("data-line")) : null;

    if (state.highlightedSymbol === name) {
      state.highlightedSymbol = null;
      state.highlightedSymbolLine = null;
    } else {
      state.highlightedSymbol = name;
      state.highlightedSymbolLine = lineNo;
    }

    renderQuiz();
  });

  if (!state.answered) {
    document.querySelectorAll(".code-line.clickable").forEach((el) => {
      el.addEventListener("click", () => toggleLine(Number(el.getAttribute("data-line"))));
      el.addEventListener("keydown", (e) => {
        const event = e as KeyboardEvent;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggleLine(Number(el.getAttribute("data-line")));
        }
      });
    });

    document.getElementById("hint-btn")?.addEventListener("click", () => {
      state.showHint = true;
      persistCurrentProgress();
      renderQuiz();
    });

    document.getElementById("submit-btn")?.addEventListener("click", submitAnswer);
  } else {
    document.getElementById("next-btn")?.addEventListener("click", nextQuestion);
  }
}

function renderResult(): void {
  const total = state.quizQuestions.length;
  const percentage = Math.round((state.score / total) * 100);
  const meta = DIFFICULTY_META[state.difficulty];

  let message: string;
  if (percentage === 100) {
    message = "完璧です！アンチパターンを見抜く目が養われています。";
  } else if (percentage >= 70) {
    message = "よくできました。解説を振り返ってさらに腕を磨きましょう。";
  } else if (percentage >= 40) {
    message = "もう一息。実際のコードレビューで意識してみてください。";
  } else {
    message = "復習のチャンスです。もう一度挑戦してみましょう！";
  }

  app.innerHTML = `
    <main class="container">
      <section class="card result-card">
        <p class="section-label">(Result)</p>
        <p class="diff-pill ${meta.color} result-diff">${meta.label}</p>
        <h1>結果発表</h1>
        <p class="score-display">${state.score} <span>/ ${total}</span></p>
        <p class="score-percent">${percentage}%</p>
        <p class="result-message">${message}</p>

        <div class="result-actions">
          <button class="btn btn-primary btn-large" id="retry-btn">同じ難易度でもう一度</button>
          <button class="btn btn-ghost" id="home-btn">難易度を選ぶ</button>
        </div>
      </section>
    </main>
  `;

  document.getElementById("retry-btn")!.addEventListener("click", () => startQuiz(true));
  document.getElementById("home-btn")!.addEventListener("click", () => {
    state.screen = "start";
    render();
  });
}

function toggleLine(lineNo: number): void {
  if (state.answered) return;
  if (state.selectedLines.has(lineNo)) {
    state.selectedLines.delete(lineNo);
  } else {
    state.selectedLines.add(lineNo);
  }
  persistCurrentProgress();
  renderQuiz();
}

function submitAnswer(): void {
  const question = state.quizQuestions[state.currentIndex];
  const isCorrect = isSelectionCorrect(
    state.selectedLines,
    question.antiPatternLines,
    question.code,
  );

  state.answered = true;
  state.lastCorrect = isCorrect;
  state.questionResults[state.currentIndex] = isCorrect;
  state.questionAttempts[state.currentIndex] = {
    selectedLines: [...state.selectedLines],
    lastCorrect: isCorrect,
    showHint: state.showHint,
  };
  syncScoreFromResults();

  persistCurrentProgress();
  renderQuiz();
}

function nextQuestion(): void {
  if (state.currentIndex < state.quizQuestions.length - 1) {
    stashCurrentQuestionDraft();
    state.currentIndex++;
    applyQuestionState(state.currentIndex);
    persistCurrentProgress();
    renderQuiz();
  } else if (state.questionResults.every((r) => r !== null)) {
    clearProgress(state.difficulty);
    state.screen = "result";
    render();
  } else {
    openQuestionList("quiz");
  }
}

function ensureQuizSession(): void {
  const saved = getValidProgress(
    state.difficulty,
    getDifficultyQuestionIds(state.difficulty),
    countByDifficulty(state.difficulty),
  );

  if (saved && restoreQuizFromProgress(saved)) {
    return;
  }

  if (sessionMatchesDifficulty()) {
    return;
  }

  state.quizQuestions = shuffleQuestions(getQuestionsByDifficulty(state.difficulty));
  state.currentIndex = 0;
  initQuestionTracking(state.quizQuestions.length);
  resetCurrentQuestionUi();
  syncScoreFromResults();
  // 未着手のまま保存しない（一覧閲覧だけで「続きから」にならないようにする）
}

function openQuestionList(origin: "start" | "quiz"): void {
  if (origin === "quiz") {
    persistCurrentProgress();
    state.listQuizDifficulty = state.difficulty;
  } else {
    state.listQuizDifficulty = null;
    ensureQuizSession();
  }

  state.listOrigin = origin;
  state.screen = "list";
  render();
}

function goToQuestion(index: number): void {
  if (index < 0 || index >= state.quizQuestions.length) return;

  stashCurrentQuestionDraft();
  state.currentIndex = index;
  applyQuestionState(index);
  state.screen = "quiz";
  persistCurrentProgress();
  render();
}

function startQuiz(fresh: boolean): void {
  if (!fresh) {
    const saved = getValidProgress(
      state.difficulty,
      getDifficultyQuestionIds(state.difficulty),
      countByDifficulty(state.difficulty),
    );
    if (saved) {
      if (hasStartedProgress(saved) && restoreQuizFromProgress(saved)) {
        state.screen = "quiz";
        render();
        return;
      }
      clearProgress(state.difficulty);
    }
  }

  clearProgress(state.difficulty);
  state.quizQuestions = shuffleQuestions(getQuestionsByDifficulty(state.difficulty));
  state.currentIndex = 0;
  initQuestionTracking(state.quizQuestions.length);
  resetCurrentQuestionUi();
  syncScoreFromResults();
  state.screen = "quiz";
  persistCurrentProgress();
  render();
}

function render(): void {
  switch (state.screen) {
    case "start":
      renderStart();
      break;
    case "list":
      renderQuestionList();
      break;
    case "quiz":
      renderQuiz();
      break;
    case "result":
      renderResult();
      break;
  }
}

render();
