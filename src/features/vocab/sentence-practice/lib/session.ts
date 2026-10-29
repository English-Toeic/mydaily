// lib/session.ts
import type { DiffOp, SentenceCheck, SentenceVerdict } from "@/lib/sentences";
import type { RetryInfo } from "./retry";

export type Phase = "answering" | "retry" | "checked";
export type Graded = Pick<SentenceCheck, "best" | "diff">;

export interface Result {
  vi: string;
  input: string;
  best: string;
  diff: DiffOp[];
  verdict: SentenceVerdict;
  hinted: boolean;
  overridden: boolean;
}

interface CardState {
  phase: Phase;
  input: string;
  /** Câu đã chấm ở lần sai đầu, để không chấm lại khi chưa sửa gì */
  retryInput: string | null;
  verdict: SentenceVerdict | null;
  graded: Graded | null;
  retryInfo: RetryInfo | null;
  hinted: boolean;
  overridden: boolean;
  shaking: boolean;
}

export interface SessionState extends CardState {
  index: number;
  results: Result[];
}

const FRESH_CARD: CardState = {
  phase: "answering",
  input: "",
  retryInput: null,
  verdict: null,
  graded: null,
  retryInfo: null,
  hinted: false,
  overridden: false,
  shaking: false,
};

export const initialSession: SessionState = { index: 0, results: [], ...FRESH_CARD };

export type SessionAction =
  | { type: "input"; value: string }
  | { type: "hint" }
  | { type: "retry"; graded: Graded; info: RetryInfo }
  | { type: "finish"; verdict: SentenceVerdict; graded: Graded }
  | { type: "override" }
  | { type: "next"; vi: string }
  | { type: "restart" }
  | { type: "shakeEnd" };

export function sessionReducer(s: SessionState, a: SessionAction): SessionState {
  switch (a.type) {
    case "input":
      if (s.phase === "checked") return s;
      // Gõ lại sau lần sai đầu thì bỏ viền đỏ
      return { ...s, input: a.value, verdict: s.phase === "retry" ? null : s.verdict };

    case "hint":
      return s.phase === "checked" ? s : { ...s, hinted: true };

    case "retry":
      if (s.phase !== "answering") return s;
      return {
        ...s,
        phase: "retry",
        verdict: "wrong",
        graded: a.graded,
        retryInfo: a.info,
        retryInput: s.input.trim(),
        shaking: true,
      };

    case "finish":
      if (s.phase === "checked") return s;
      return {
        ...s,
        phase: "checked",
        verdict: a.verdict,
        graded: a.graded,
        retryInfo: null,
        shaking: s.shaking || a.verdict === "wrong",
      };

    case "override":
      if (s.phase !== "checked" || s.verdict !== "wrong") return s;
      return { ...s, verdict: "correct", overridden: true };

    case "next": {
      if (s.phase !== "checked" || !s.verdict || !s.graded) return s;
      const result: Result = {
        vi: a.vi,
        input: s.input.trim(),
        best: s.graded.best,
        diff: s.graded.diff,
        verdict: s.verdict,
        hinted: s.hinted,
        overridden: s.overridden,
      };
      return { ...s, ...FRESH_CARD, index: s.index + 1, results: [...s.results, result] };
    }

    case "restart":
      return initialSession;

    case "shakeEnd":
      return s.shaking ? { ...s, shaking: false } : s;
  }
}

export function canCheck(s: SessionState): boolean {
  const text = s.input.trim();
  if (s.phase === "checked" || !text) return false;
  // Ở bước sửa lại, phải sửa gì đó mới được chấm tiếp
  return !(s.phase === "retry" && text === s.retryInput);
}