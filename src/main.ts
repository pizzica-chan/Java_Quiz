import "./style.css";
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

type Screen = "start" | "quiz" | "result";

interface AppState {
  screen: Screen;
  difficulty: Difficulty;
  quizQuestions: QuizQuestion[];
  currentIndex: number;
  selectedLines: Set<number>;
  answered: boolean;
  score: number;
  lastCorrect: boolean | null;
  showHint: boolean;
  highlightedSymbol: string | null;
  highlightedSymbolLine: number | null;
}

const state: AppState = {
  screen: "start",
  difficulty: "beginner",
  quizQuestions: [],
  currentIndex: 0,
  selectedLines: new Set(),
  answered: false,
  score: 0,
  lastCorrect: null,
  showHint: false,
  highlightedSymbol: null,
  highlightedSymbolLine: null,
};

const app = document.getElementById("app")!;

const DIFFICULTIES: Difficulty[] = ["beginner", "intermediate", "advanced"];

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapSymbols(
  html: string,
  lineNo: number,
  activeSym: string | null,
  activeLine: number | null,
): string {
  return html.replace(/(<[^>]+>)|(\b[A-Za-z_][A-Za-z0-9_]*\b)/g, (match, tag, ident) => {
    if (tag) return tag;
    if (!ident) return match;

    const classes = ["sym"];
    if (activeSym !== null && ident === activeSym) {
      classes.push("sym-highlight");
      if (lineNo === activeLine) classes.push("sym-active");
    }

    return `<span class="${classes.join(" ")}" data-sym="${escapeHtml(ident)}">${ident}</span>`;
  });
}

function highlightJava(
  line: string,
  lineNo: number,
  activeSym: string | null,
  activeLine: number | null,
): string {
  const escaped = escapeHtml(line);
  if (!line.trim()) return escaped;

  const placeholders: string[] = [];
  const stash = (html: string): string => {
    const id = placeholders.length;
    placeholders.push(html);
    return `\x00PH${id}\x00`;
  };

  let out = escaped
    .replace(/(\/\/.*)$/g, (match) => stash(`<span class="cmt">${match}</span>`))
    .replace(/("(?:\\.|[^"\\])*")/g, (match) => stash(`<span class="str">${match}</span>`))
    .replace(/\b(\d+)\b/g, (match) => stash(`<span class="num">${match}</span>`))
    .replace(
      /\b(public|private|protected|class|interface|extends|implements|return|if|else|for|while|try|catch|finally|throw|throws|new|static|final|void|int|long|boolean|double|float|String|List|Map|Optional|Date|synchronized|volatile|import|package|this|super|null|true|false|instanceof|switch|case|default|Override)\b/g,
      (match) => stash(`<span class="kw">${match}</span>`),
    );

  return wrapSymbols(
    out.replace(/\x00PH(\d+)\x00/g, (_, index) => placeholders[Number(index)]!),
    lineNo,
    activeSym,
    activeLine,
  );
}

function renderStart(): void {
  const difficultyCards = DIFFICULTIES.map((d) => {
    const meta = DIFFICULTY_META[d];
    const count = countByDifficulty(d);
    const selected = state.difficulty === d;
    return `
      <button
        type="button"
        class="difficulty-card ${meta.color} ${selected ? "selected" : ""}"
        data-difficulty="${d}"
        aria-pressed="${selected}"
      >
        <span class="difficulty-label">${meta.label}</span>
        <span class="difficulty-desc">${meta.description}</span>
        <span class="difficulty-count">${count} 問</span>
      </button>
    `;
  }).join("");

  const meta = DIFFICULTY_META[state.difficulty];

  app.innerHTML = `
    <main class="container">
      <header class="hero">
        <h1>Java アンチパターン クイズ</h1>
        <p class="lead">
          Java のコードサンプルを読み、アンチパターンになっている<strong>行</strong>を見つけましょう。
          難易度を選んで挑戦できます。
        </p>
      </header>

      <section class="card difficulty-section">
        <h2>難易度を選択</h2>
        <div class="difficulty-grid" role="group" aria-label="難易度">
          ${difficultyCards}
        </div>
      </section>

      <section class="card info-card">
        <h2>遊び方</h2>
        <ol>
          <li>難易度を選んで「クイズを始める」を押します</li>
          <li>問題文の観点に沿って、アンチパターンの行をクリックします</li>
          <li>同種の問題が複数行ある場合は、代表の1行でも正解です</li>
          <li>「回答する」で採点。解説を読んで次へ進みます</li>
        </ol>
      </section>

      <button class="btn btn-primary btn-large" id="start-btn">
        ${meta.label}（${countByDifficulty(state.difficulty)}問）で始める
      </button>
    </main>
  `;

  document.querySelectorAll("[data-difficulty]").forEach((el) => {
    el.addEventListener("click", () => {
      state.difficulty = el.getAttribute("data-difficulty") as Difficulty;
      renderStart();
    });
  });

  document.getElementById("start-btn")!.addEventListener("click", startQuiz);
}

function renderQuiz(): void {
  const question = state.quizQuestions[state.currentIndex];
  const total = state.quizQuestions.length;
  const progress = ((state.currentIndex + (state.answered ? 1 : 0)) / total) * 100;
  const meta = DIFFICULTY_META[state.difficulty];

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
          <code class="line-code">${highlightJava(line, lineNo, state.highlightedSymbol, state.highlightedSymbolLine) || "&nbsp;"}</code>
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
            問題 ${state.currentIndex + 1} / ${total}
          </span>
          <span>スコア: ${state.score}</span>
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
            <span class="dot red"></span>
            <span class="dot yellow"></span>
            <span class="dot green"></span>
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
              ヒントを見る
            </button>
            <button class="btn btn-primary" id="submit-btn" ${state.selectedLines.size === 0 ? "disabled" : ""}>
              回答する
            </button>
          `
              : `
            <button class="btn btn-primary" id="next-btn">
              ${state.currentIndex < total - 1 ? "次の問題へ" : "結果を見る"}
            </button>
          `
          }
        </div>
      </section>
    </main>
  `;

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

  document.getElementById("retry-btn")!.addEventListener("click", startQuiz);
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
  if (isCorrect) state.score++;

  renderQuiz();
}

function nextQuestion(): void {
  if (state.currentIndex < state.quizQuestions.length - 1) {
    state.currentIndex++;
    state.selectedLines = new Set();
    state.answered = false;
    state.lastCorrect = null;
    state.showHint = false;
    state.highlightedSymbol = null;
    state.highlightedSymbolLine = null;
    renderQuiz();
  } else {
    state.screen = "result";
    render();
  }
}

function startQuiz(): void {
  state.quizQuestions = shuffleQuestions(getQuestionsByDifficulty(state.difficulty));
  state.currentIndex = 0;
  state.selectedLines = new Set();
  state.answered = false;
  state.score = 0;
  state.lastCorrect = null;
  state.showHint = false;
  state.highlightedSymbol = null;
  state.highlightedSymbolLine = null;
  state.screen = "quiz";
  render();
}

function render(): void {
  switch (state.screen) {
    case "start":
      renderStart();
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
