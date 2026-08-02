import type { Difficulty } from "./quizTypes";

const STORAGE_KEY = "java-quiz-progress-v2";

export interface QuestionAttempt {
  selectedLines: number[];
  showHint: boolean;
  /** 回答済みは true/false、未提出のドラフトは null */
  lastCorrect: boolean | null;
}

export interface DifficultyProgress {
  questionIds: number[];
  currentIndex: number;
  questionResults: (boolean | null)[];
  questionAttempts: (QuestionAttempt | null)[];
  selectedLines: number[];
  answered: boolean;
  lastCorrect: boolean | null;
  showHint: boolean;
  updatedAt: number;
}

export interface ProgressSummary {
  answeredCount: number;
  total: number;
  score: number;
}

type ProgressStore = Partial<Record<Difficulty, DifficultyProgress>>;

function readStore(): ProgressStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ProgressStore;
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store: ProgressStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // quota exceeded などは無視
  }
}

export function computeScore(results: (boolean | null)[]): number {
  return results.filter((r) => r === true).length;
}

/** 一覧閲覧だけなど、未着手のセッションは「続きから」に出さない */
export function hasStartedProgress(progress: DifficultyProgress): boolean {
  if (progress.currentIndex > 0) return true;
  if (progress.answered) return true;
  if (progress.showHint) return true;
  if (progress.selectedLines.length > 0) return true;
  if (progress.questionResults.some((r) => r !== null)) return true;
  if (progress.questionAttempts.some((a) => a !== null)) return true;
  return false;
}

function normalizeProgress(progress: DifficultyProgress): DifficultyProgress | null {
  const len = progress.questionIds.length;
  if (len === 0) return null;

  const questionResults = Array.isArray(progress.questionResults)
    ? [...progress.questionResults]
    : Array<boolean | null>(len).fill(null);
  const questionAttempts = Array.isArray(progress.questionAttempts)
    ? progress.questionAttempts.map((attempt) =>
        attempt
          ? {
              selectedLines: [...attempt.selectedLines],
              showHint: Boolean(attempt.showHint),
              lastCorrect:
                attempt.lastCorrect === true || attempt.lastCorrect === false
                  ? attempt.lastCorrect
                  : null,
            }
          : null,
      )
    : Array<QuestionAttempt | null>(len).fill(null);

  if (questionResults.length !== len || questionAttempts.length !== len) {
    return null;
  }

  if (
    progress.answered &&
    progress.lastCorrect !== null &&
    questionResults[progress.currentIndex] === null
  ) {
    questionResults[progress.currentIndex] = progress.lastCorrect;
    questionAttempts[progress.currentIndex] = {
      selectedLines: [...progress.selectedLines],
      lastCorrect: progress.lastCorrect,
      showHint: progress.showHint,
    };
  }

  return {
    ...progress,
    questionResults,
    questionAttempts,
  };
}

function isValidProgress(
  progress: DifficultyProgress,
  validQuestionIds: Set<number>,
  expectedCount: number,
): boolean {
  if (
    !Array.isArray(progress.questionIds) ||
    progress.questionIds.length !== expectedCount ||
    progress.questionIds.some((id) => !validQuestionIds.has(id))
  ) {
    return false;
  }

  if (
    !Number.isInteger(progress.currentIndex) ||
    progress.currentIndex < 0 ||
    progress.currentIndex >= progress.questionIds.length
  ) {
    return false;
  }

  if (!Array.isArray(progress.selectedLines)) {
    return false;
  }

  return normalizeProgress(progress) !== null;
}

export function loadProgress(difficulty: Difficulty): DifficultyProgress | null {
  const progress = readStore()[difficulty];
  if (!progress) return null;
  return normalizeProgress(progress);
}

export function saveProgress(
  difficulty: Difficulty,
  progress: DifficultyProgress,
): void {
  const store = readStore();
  store[difficulty] = { ...progress, updatedAt: Date.now() };
  writeStore(store);
}

export function clearProgress(difficulty: Difficulty): void {
  const store = readStore();
  delete store[difficulty];
  writeStore(store);
}

export function getProgressSummary(
  difficulty: Difficulty,
  validQuestionIds: Set<number>,
  expectedCount: number,
): ProgressSummary | null {
  const progress = getValidProgress(difficulty, validQuestionIds, expectedCount);
  if (!progress || !hasStartedProgress(progress)) return null;

  const answeredCount = progress.questionResults.filter((r) => r !== null).length;

  return {
    answeredCount,
    total: progress.questionIds.length,
    score: computeScore(progress.questionResults),
  };
}

export function getValidProgress(
  difficulty: Difficulty,
  validQuestionIds: Set<number>,
  expectedCount: number,
): DifficultyProgress | null {
  const progress = loadProgress(difficulty);
  if (!progress || !isValidProgress(progress, validQuestionIds, expectedCount)) {
    if (progress) clearProgress(difficulty);
    return null;
  }
  return progress;
}
