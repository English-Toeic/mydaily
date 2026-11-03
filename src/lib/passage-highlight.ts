import { lemma } from "@/lib/text-match";
import type { Word } from "@/types/vocab";

export type TextSegment = { text: string; word?: Word };

const TOKEN_RE = /[\p{L}\p{N}]+(?:['’]\p{L}+)*/gu;
const PLACEHOLDERS = new Set(["sb", "sth", "someone", "somebody", "something", "one's", "oneself"]);
const LEADING = new Set(["to", "a", "an", "the", "be"]);
const WILD = "*";
const MAX_GAP = 3;

type Tok = { raw: string; lem: string; start: number; end: number };
type Pattern = { tokens: string[]; word: Word };

const clean = (s: string) => s.toLowerCase().replace(/’/g, "'");

function patternsOf(word: Word): string[][] {
  const out: string[][] = [];
  for (const variant of word.english.replace(/\(.*?\)/g, " ").split(/[,;/|]/)) {
    const raw = (clean(variant).match(TOKEN_RE) ?? []).map((t) => (PLACEHOLDERS.has(t) ? WILD : t));
    while (raw.length && (raw[0] === WILD || LEADING.has(raw[0]))) raw.shift();
    while (raw.length && raw[raw.length - 1] === WILD) raw.pop();
    if (!raw.length || (raw.length === 1 && raw[0].length < 3)) continue;
    out.push(raw.map((t) => (t === WILD ? t : lemma(t))));
  }
  return out;
}

function matchAt(toks: Tok[], i: number, pat: string[], p: number): number {
  if (p === pat.length) return i;
  if (pat[p] === WILD) {
    for (let k = 0; k <= MAX_GAP && i + k <= toks.length; k++) {
      const end = matchAt(toks, i + k, pat, p + 1);
      if (end >= 0) return end;
    }
    return -1;
  }
  const t = toks[i];
  if (!t || (t.lem !== pat[p] && t.raw !== pat[p])) return -1;
  return matchAt(toks, i + 1, pat, p + 1);
}

/** Tạo một lần cho mỗi deck, gọi nhiều lần cho từng câu */
export function buildMatcher(words: Word[]): (text: string) => TextSegment[] {
  const index = new Map<string, Pattern[]>();
  for (const word of words) {
    for (const tokens of patternsOf(word)) {
      const list = index.get(tokens[0]) ?? [];
      list.push({ tokens, word });
      index.set(tokens[0], list);
    }
  }

  return (text) => {
    if (!index.size) return [{ text }];
    const toks: Tok[] = [...text.matchAll(TOKEN_RE)].map((m) => {
      const raw = clean(m[0]);
      const start = m.index ?? 0;
      return { raw, lem: lemma(raw), start, end: start + m[0].length };
    });

    const segs: TextSegment[] = [];
    let pos = 0;
    for (let i = 0; i < toks.length; ) {
      const t = toks[i];
      const cands = [...(index.get(t.lem) ?? []), ...(t.raw !== t.lem ? index.get(t.raw) ?? [] : [])];
      let hit: { end: number; word: Word } | null = null;
      for (const p of cands) {
        const end = matchAt(toks, i, p.tokens, 0);
        if (end > i && (!hit || end > hit.end)) hit = { end, word: p.word }; // ưu tiên cụm dài nhất
      }
      if (!hit) {
        i++;
        continue;
      }
      const from = t.start;
      const to = toks[hit.end - 1].end;
      if (from > pos) segs.push({ text: text.slice(pos, from) });
      segs.push({ text: text.slice(from, to), word: hit.word });
      pos = to;
      i = hit.end;
    }
    if (pos < text.length) segs.push({ text: text.slice(pos) });
    return segs;
  };
}

/** Như buildMatcher nhưng nhớ kết quả của từng câu */
export function buildCachedMatcher(words: Word[]) {
  const match = buildMatcher(words);
  const cache = new Map<string, TextSegment[]>();
  return (text: string): TextSegment[] => {
    let segs = cache.get(text);
    if (!segs) {
      segs = match(text);
      cache.set(text, segs);
    }
    return segs;
  };
}