export interface VoiceSlot {
  voice: SpeechSynthesisVoice | null;
  pitch: number;
}

export const DEFAULT_SLOT: VoiceSlot = { voice: null, pitch: 1 };

const NATURAL = /natural|online|neural|google|premium|enhanced/i;
/** Thiếu giọng thì đổi cao độ để các nhân vật vẫn nghe khác nhau */
const PITCHES = [1, 0.85, 1.15, 0.95, 1.08];

function rank(v: SpeechSynthesisVoice): number {
  let r = 0;
  if (NATURAL.test(v.name)) r -= 10;
  if (v.lang === "en-US") r -= 3;
  else if (v.lang === "en-GB") r -= 2;
  else if (v.lang.startsWith("en")) r -= 1;
  return r;
}

/** Key "" dành cho người dẫn (bài nói) */
export function assignVoices(speakers: string[], voices: SpeechSynthesisVoice[]): Map<string, VoiceSlot> {
  const ranked = [...new Map(voices.map((v) => [v.name, v])).values()].sort((a, b) => rank(a) - rank(b));
  const keys = speakers.length ? speakers : [""];
  const map = new Map<string, VoiceSlot>();

  keys.forEach((sp, i) => {
    const voice = ranked.length ? ranked[i % ranked.length] : null;
    const round = ranked.length ? Math.floor(i / ranked.length) : i;
    map.set(sp, { voice, pitch: PITCHES[round % PITCHES.length] });
  });
  if (!map.has("")) map.set("", map.get(keys[0]) ?? DEFAULT_SLOT);
  return map;
}