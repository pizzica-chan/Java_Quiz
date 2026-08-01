export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface QuizQuestion {
  id: number;
  difficulty: Difficulty;
  title: string;
  description: string;
  code: string[];
  /** 1-based line numbers that contain anti-patterns */
  antiPatternLines: number[];
  explanation: string;
  patternName: string;
  hint?: string;
}
