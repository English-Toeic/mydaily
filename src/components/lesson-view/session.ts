import type { AnswerStatus, SessionMode, SessionView } from "./types";

export type SessionState = {
  view: SessionView;
  mode: SessionMode;
  index: number;
  /** Tăng mỗi lần vào một câu, kể cả khi index không đổi. Dùng để kích hoạt autoplay và focus */
  step: number;
  answer: string;
  /** Câu trả lời ở lần kiểm tra gần nhất. Gợi ý được tính từ đây nên không "nhảy" khi đang gõ */
  checkedAnswer: string;
  status: AnswerStatus;
  attempts: number;
};

export type SessionAction =
  | { type: "go"; index: number }
  | { type: "restart"; mode: SessionMode; index: number }
  | { type: "input"; value: string }
  | { type: "wrong" }
  | { type: "correct" }
  | { type: "giveUp" }
  | { type: "complete" };

const freshStep = (state: SessionState, index: number): SessionState => ({
  ...state,
  view: "practice",
  index,
  step: state.step + 1,
  answer: "",
  checkedAnswer: "",
  status: "answering",
  attempts: 0,
});

export function createInitialState(startIndex: number, completed: boolean): SessionState {
  return {
    view: completed ? "completion" : "practice",
    mode: "learn",
    index: Math.max(0, startIndex),
    step: 0,
    answer: "",
    checkedAnswer: "",
    status: "answering",
    attempts: 0,
  };
}

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case "go":
      return freshStep(state, action.index);
    case "restart":
      return { ...freshStep(state, action.index), mode: action.mode };
    case "input":
      // Khoá ô nhập sau khi đã có kết quả
      if (state.status === "correct" || state.status === "revealed") return state;
      return { ...state, answer: action.value };
    case "wrong":
      return {
        ...state,
        status: "wrong",
        attempts: state.attempts + 1,
        checkedAnswer: state.answer,
      };
    case "correct":
      return { ...state, status: "correct" };
    case "giveUp":
      return { ...state, status: "revealed" };
    case "complete":
      return { ...state, view: "completion" };
  }
}