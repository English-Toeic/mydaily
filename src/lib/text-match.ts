// src/lib/text-match.ts
/** Các hàm so khớp chữ dùng chung cho chấm từ và chấm câu */

export function stripDiacritics(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
}

/** Damerau (OSA): gõ đảo 2 ký tự cạnh nhau ("teh" → "the") chỉ tính 1 lỗi */
export function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  const A = [...a], B = [...b];
  const d = Array.from({ length: A.length + 1 }, (_, i) => {
    const row = new Array<number>(B.length + 1).fill(0);
    row[0] = i;
    return row;
  });
  for (let j = 0; j <= B.length; j++) d[0][j] = j;

  for (let i = 1; i <= A.length; i++) {
    for (let j = 1; j <= B.length; j++) {
      const cost = A[i - 1] === B[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && A[i - 1] === B[j - 2] && A[i - 2] === B[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[A.length][B.length];
}

/** Từ ngắn (< 4 chữ) không cho sai, tránh "bad" lọt thành "bat" */
export const typoTolerance = (len: number) => (len >= 8 ? 2 : len >= 4 ? 1 : 0);

/** Đưa cách viết Anh-Anh về Anh-Mỹ (chỉ dùng để so sánh, không hiển thị) */
const US_RULES: [RegExp, string][] = [
  [/our(s|ed|ing|ite|ites|able|er|ers)?$/, "or$1"], // colour, favourite
  [/([^aeiou])re(s)?$/, "$1er$2"],                  // centre, theatre
  [/is(e|es|ed|ing|ation|ations)$/, "iz$1"],        // organise, realisation
  [/ys(e|es|ed|ing)$/, "yz$1"],                     // analyse
  [/ogue(s)?$/, "og$1"],                            // catalogue
  [/ence(s)?$/, "ense$1"],                          // defence, licence
  [/([aeiou])ll(ed|ing|er|ers)$/, "$1l$2"],         // travelled
];

export function toUS(w: string): string {
  if (w.length < 5) return w; // tránh "four" → "for", "hour" → "hor"
  for (const [re, rep] of US_RULES) if (re.test(w)) return w.replace(re, rep);
  return w;
}

/** Gốc từ thô: apples → appl, studied → study, running → run, making → mak */
export function enBase(w: string): string {
  if (w.length <= 3) return w;
  const dbl = w.match(/^(.{2,}?)([bdgklmnprt])\2(?:ing|ed)$/);
  if (dbl) return dbl[1] + dbl[2];
  return w
    .replace(/i(?:es|ed)$/, "y")
    .replace(/(?<=ss|sh|ch|x|z|o)es$|(?<![su])s$|(?<=\p{L}{3})(?:ing|ed)$/u, "")
    .replace(/e$/, "");
}

/** Động từ bất quy tắc và danh từ số nhiều đặc biệt hay gặp. Từ đầu mỗi dòng là gốc */
const IRREGULAR_GROUPS = `
be am is are was were been being|have has had having|do does did done|go goes went gone
make made|take took taken|get got gotten|give gave given|come came|see saw seen
know knew known|think thought|buy bought|bring brought|teach taught|catch caught
eat ate eaten|write wrote written|speak spoke spoken|break broke broken|choose chose chosen
begin began begun|run ran|swim swam swum|drink drank drunk|sing sang sung|find found
feel felt|leave left|keep kept|sleep slept|meet met|pay paid|say said|tell told|sell sold
stand stood|understand understood|lose lost|hold held|build built|send sent|spend spent
fall fell fallen|forget forgot forgotten|drive drove driven|ride rode ridden|rise rose risen
wake woke woken|wear wore worn|grow grew grown|throw threw thrown|fly flew flown
draw drew drawn|show showed shown|hear heard|read|put|cut|let|set|hit|cost|hurt|shut
child children|man men|woman women|person people|foot feet|tooth teeth|mouse mice`;

const IRREGULAR = new Map<string, string>();
for (const group of IRREGULAR_GROUPS.split(/[|\n]/)) {
  const [root, ...forms] = group.trim().split(/\s+/);
  if (root) for (const f of [root, ...forms]) IRREGULAR.set(f, root);
}

/** Đưa về dạng gốc để nhận ra "cùng từ, khác dạng" (went ~ go, apples ~ apple) */
export const lemma = (w: string) => IRREGULAR.get(w) ?? enBase(w);